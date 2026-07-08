from flask import Flask, jsonify
from flask_cors import CORS
from flask import request

app = Flask(__name__)
CORS(app)

@app.route('/water-color', methods=['GET'])
def get_water_color():
    ph = float(request.args.get('ph'))
    turbidity = float(request.args.get('turbidity'))
    tds = float(request.args.get('tds'))

    color = 'biru'

    if ph < 5.0 or ph > 9.5 or turbidity > 30 or tds > 1500:
        color = 'cokelat'
    elif (ph >= 5.0 and ph < 6.0) or (ph >= 8.5 and ph <= 9.5) and (turbidity >= 15 and turbidity <= 30) and (tds >= 800 and tds <= 1500):
        color = 'oranye'
    elif (ph >= 5.0 and ph < 6.0) or (ph >= 8.5 and ph <= 9.5) and (turbidity >= 15 and turbidity <= 30) and (tds >= 800 and tds <= 1500):
        color = 'biru'
    elif ph >= 6.5 and ph <= 8.0 and turbidity < 5 and tds < 500:
        color = 'putih'

    return jsonify({'color': color})

if __name__ == '__main__':
    app.run(debug=True)