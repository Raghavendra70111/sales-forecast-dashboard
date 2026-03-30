import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# Matches sales.ipynb: train on Order Year <= 2015, test on Order Year > 2015
SARIMA_TRAIN_YEAR_MAX = 2015


def get_df():
    path = 'data.csv'
    if not os.path.exists(path):
        path = os.path.join('content', 'data.csv')

    df = pd.read_csv(path)

    val_col = 'Sales' if 'Sales' in df.columns else 'Total'
    df[val_col] = (
        df[val_col]
        .astype(str)
        .str.replace(r'[\$,]', '', regex=True)
    )
    df[val_col] = pd.to_numeric(df[val_col], errors='coerce').fillna(0.0)

    date_col = 'Order Date' if 'Order Date' in df.columns else 'Month'
    df[date_col] = pd.to_datetime(df[date_col], dayfirst=True)

    df['YearMonth'] = df[date_col].dt.strftime('%Y-%m')
    df['year'] = df[date_col].dt.year
    df['month'] = df[date_col].dt.month
    df['month_name'] = df[date_col].dt.strftime('%b')
    df['State'] = df['State'].fillna('Unknown').astype(str).str.strip()
    return df, val_col


def _clean_payload_value(value):
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime('%Y-%m-%d')
    if isinstance(value, (float, int, np.integer, np.floating)):
        return float(value)
    return str(value)


@app.route('/api/sales-trend')
def sales_trend():
    df, col = get_df()

    res = (
        df.groupby(['year', 'month'])[col]
        .sum()
        .reset_index()
    )

    res['name'] = res['year'].astype(str) + '-' + res['month'].astype(str).str.zfill(2)
    res = res[['name', col]]
    res.columns = ['name', 'sales']

    return jsonify(res.to_dict(orient='records'))


@app.route('/api/monthly-breakdown')
def monthly_breakdown():
    df, col = get_df()
    result = (
        df.groupby('month')[col]
        .sum()
        .reindex(range(1, 13), fill_value=0)
        .reset_index()
    )

    result['name'] = result['month'].apply(lambda x: MONTH_ORDER[x-1])
    result = result[['name', col]]
    result.columns = ['name', 'sales']

    return jsonify(result.to_dict(orient='records'))


@app.route('/api/yearly-sales')
def yearly_sales():
    df, col = get_df()
    result = df.groupby('year')[col].sum().reset_index()
    result.columns = ['year', 'sales']
    return jsonify(result.to_dict(orient='records'))


@app.route('/api/summary')
def summary():
    df, col = get_df()
    monthly = df.groupby('YearMonth')[col].sum().reset_index(name='sales')
    monthly['sales'] = pd.to_numeric(monthly['sales'], errors='coerce').fillna(0.0)
    monthly = monthly.sort_values('YearMonth')
    growth = 0.0
    if len(monthly) > 1 and monthly.iloc[-2]['sales'] != 0:
        growth = (
            (monthly.iloc[-1]['sales'] - monthly.iloc[-2]['sales'])
            / monthly.iloc[-2]['sales']
        ) * 100

    return jsonify({
        'total_sales': float(df[col].sum()),
        'average_order': float(df[col].mean()),
        'num_orders': int(len(df)),
        'monthly_growth': float(growth),
    })


@app.route('/api/sarima-forecast')
def sarima_forecast():
    """
    Aligns with sales.ipynb:
    - monthly_sales_trend = groupby Order Year + Order Month
    - train: Order Year <= 2015, test: Order Year > 2015
    - SARIMAX(1,1,1) x (0,1,0,12) on training Total, forecast test period
    """
    df, col = get_df()
    monthly_sales_trend = df.groupby(['year', 'month'], as_index=False)[col].sum()
    monthly_sales_trend = monthly_sales_trend.rename(columns={col: 'Total'})
    monthly_sales_trend['YearMonth'] = (
        monthly_sales_trend['year'].astype(str)
        + '-'
        + monthly_sales_trend['month'].astype(str).str.zfill(2)
    )
    monthly_sales_trend = monthly_sales_trend.sort_values(['year', 'month'])

    train_data = monthly_sales_trend[monthly_sales_trend['year'] <= SARIMA_TRAIN_YEAR_MAX]
    test_data = monthly_sales_trend[monthly_sales_trend['year'] > SARIMA_TRAIN_YEAR_MAX]

    chart = []
    train_list = []
    for _, row in train_data.iterrows():
        chart.append({
            'name': row['YearMonth'],
            'train': float(row['Total']),
            'actual': None,
            'forecast': None,
            'upper': None,
            'lower': None,
        })
        train_list.append({'YearMonth': row['YearMonth'], 'Total': float(row['Total'])})

    if len(test_data) == 0:
        return jsonify({
            'chart': chart,
            'train': train_list,
            'actual': [],
            'forecast': [],
            'metrics': {'mae': None, 'rmse': None, 'note': 'No test period after split year.'},
            'split_year': SARIMA_TRAIN_YEAR_MAX,
        })

    try:
        from statsmodels.tsa.statespace.sarimax import SARIMAX

        train_series = train_data['Total'].astype(float).values
        if len(train_series) < 24:
            raise ValueError('Insufficient training points for SARIMA')

        model = SARIMAX(
            train_series,
            order=(1, 1, 1),
            seasonal_order=(0, 1, 0, 12),
        )
        sarima_fit = model.fit(disp=False)
        forecast_steps = len(test_data)
        fc = sarima_fit.get_forecast(steps=forecast_steps)
        forecast_mean = fc.predicted_mean
        conf_int = fc.conf_int()
        ci_arr = np.asarray(conf_int)
        if ci_arr.ndim == 2 and ci_arr.shape[1] >= 2:
            ci_low = ci_arr[:, 0]
            ci_high = ci_arr[:, 1]
        else:
            ci_low = ci_high = np.asarray(forecast_mean).flatten()

        actual_list = []
        forecast_list = []
        y_true = test_data['Total'].astype(float).values
        y_pred = np.asarray(forecast_mean).flatten()[: len(y_true)]

        for i, (_, row) in enumerate(test_data.iterrows()):
            pred = float(y_pred[i]) if i < len(y_pred) else float('nan')
            lo = float(ci_low[i]) if i < len(ci_low) else pred
            hi = float(ci_high[i]) if i < len(ci_high) else pred
            act = float(row['Total'])
            chart.append({
                'name': row['YearMonth'],
                'train': None,
                'actual': act,
                'forecast': pred,
                'upper': hi,
                'lower': lo,
            })
            actual_list.append({'YearMonth': row['YearMonth'], 'Total': act})
            forecast_list.append({
                'YearMonth': row['YearMonth'],
                'forecast': pred,
                'upper': hi,
                'lower': lo,
            })

        mae = float(np.mean(np.abs(y_true - y_pred)))
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

        return jsonify({
            'chart': chart,
            'train': train_list,
            'actual': actual_list,
            'forecast': forecast_list,
            'metrics': {'mae': mae, 'rmse': rmse, 'note': None},
            'split_year': SARIMA_TRAIN_YEAR_MAX,
        })
    except Exception as exc:
        # Fallback: show train vs actual test without model forecast
        for _, row in test_data.iterrows():
            act = float(row['Total'])
            chart.append({
                'name': row['YearMonth'],
                'train': None,
                'actual': act,
                'forecast': None,
                'upper': None,
                'lower': None,
            })
        return jsonify({
            'chart': chart,
            'train': train_list,
            'actual': [
                {'YearMonth': r['YearMonth'], 'Total': float(r['Total'])}
                for _, r in test_data.iterrows()
            ],
            'forecast': [],
            'metrics': {'mae': None, 'rmse': None, 'note': f'SARIMA fallback: {exc!s}'},
            'split_year': SARIMA_TRAIN_YEAR_MAX,
        })


@app.route('/api/forecast')
def forecast_legacy():
    """Deprecated: kept for compatibility; prefer /api/sarima-forecast."""
    return sarima_forecast()


@app.route('/api/full-data')
def full_data():
    df, col = get_df()

    category_sales = (
        df.groupby('Product Category')[col].sum().sort_values(ascending=False).reset_index()
    )
    category_sales.columns = ['name', 'sales']

    customer_type_sales = (
        df.groupby('Customer Type')[col].sum().sort_values(ascending=False).reset_index()
    )
    customer_type_sales.columns = ['name', 'sales']

    top_products = (
        df.groupby('Product Name')[col].sum().sort_values(ascending=False).head(10).reset_index()
    )
    top_products.columns = ['name', 'sales']

    manager_performance = (
        df.groupby('Account Manager')[col].sum().sort_values(ascending=False).head(10).reset_index()
    )
    manager_performance.columns = ['name', 'sales']

    monthly_rows = df.groupby('YearMonth')[col].sum().reset_index().sort_values('YearMonth')
    monthly_rows.columns = ['name', 'sales']

    top_states = (
        df.groupby('State')[col].sum().sort_values(ascending=False).head(12).reset_index()
    )
    top_states.columns = ['name', 'sales']

    rows = [
        {k: _clean_payload_value(v) for k, v in record.items()}
        for record in df.to_dict(orient='records')
    ]

    return jsonify({
        'month_order': MONTH_ORDER,
        'rows': rows,
        'category_sales': category_sales.to_dict(orient='records'),
        'customer_type_sales': customer_type_sales.to_dict(orient='records'),
        'top_products': top_products.to_dict(orient='records'),
        'manager_performance': manager_performance.to_dict(orient='records'),
        'monthly_rows': monthly_rows.to_dict(orient='records'),
        'top_states': top_states.to_dict(orient='records'),
    })


@app.route('/api/ai-chat', methods=['POST'])
def ai_chat():
    try:
        import re

        payload = request.get_json(silent=True) or {}
        message = (payload.get('message') or '').strip().lower()

        if not message:
            return jsonify({'error': 'Empty message', 'reply': None}), 400

        df, col = get_df()
        df['year'] = df['YearMonth'].astype(str).str[:4].astype(int)

        # 🔥 normalize words
        words = re.findall(r'\w+', message)

        # 🔥 detect year
        year_match = re.search(r'20\d{2}', message)
        selected_year = int(year_match.group()) if year_match else None

        if selected_year:
            df = df[df['year'] == selected_year]

        # 🔥 keyword groups
        total_words = {"total", "sum", "overall", "all"}
        avg_words = {"average", "avg", "mean"}
        category_words = {"category", "categories"}
        state_words = {"state", "location"}
        product_words = {"product", "item"}
        trend_words = {"trend", "month", "monthly"}

        # 🔥 TOTAL
        if any(w in words for w in total_words):
            total = df[col].sum()
            if selected_year:
                return jsonify({'reply': f"📊 Total sales in {selected_year}: ${round(total,2):,}"})
            return jsonify({'reply': f"📊 Total sales: ${round(total,2):,}"})

        # 🔥 AVERAGE
        if any(w in words for w in avg_words):
            avg = df[col].mean()
            return jsonify({'reply': f"📈 Average sales: ${round(avg,2):,}"})

        # 🔥 CATEGORY
        if any(w in words for w in category_words):
            top = df.groupby('Product Category')[col].sum().idxmax()
            return jsonify({'reply': f"🏆 Top category: {top}"})

        # 🔥 STATE
        if any(w in words for w in state_words):
            top = df.groupby('State')[col].sum().idxmax()
            return jsonify({'reply': f"🌍 Top state: {top}"})

        # 🔥 PRODUCT
        if any(w in words for w in product_words):
            top = df.groupby('Product Name')[col].sum().idxmax()
            return jsonify({'reply': f"📦 Top product: {top}"})

        # 🔥 TREND
        if any(w in words for w in trend_words):
            monthly = df.groupby('YearMonth')[col].sum().sort_values(ascending=False)
            return jsonify({'reply': f"📅 Best month: {monthly.index[0]}"})

        # 🔥 fallback (smart)
        return jsonify({
            'reply': "🤖 I didn’t fully understand. Try: total, 2014, category, state, product, trend."
        })

    except Exception as e:
        return jsonify({'error': str(e), 'reply': None}), 500
    
    
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
