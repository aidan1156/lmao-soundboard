from flask import Flask, render_template, request, redirect,make_response, send_from_directory
import os
import json
import soundboard

main_dir = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__,static_url_path='/static')
app.config['PREFERRED_URL_SCHEME'] = 'https:'

soundboard = soundboard.Soundboard()


@app.route('/',methods=['GET','POST'])
def home():
    return render_template('index.html')

@app.route('/log-sentence',methods=['POST'])
def log_sentence():
    data = request.get_json()
    sentence = data.get('sentence')
    print(f"Received sentence: {sentence}")
    if len(sentence.split(' ')) > 2:
        soundboard.log_sentence(sentence)
    return {'status': 'success'}, 200

if __name__ == '__main__':
    app.run(debug=True,port=5000)