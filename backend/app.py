from flask import Flask, request, jsonify # type: ignore
from flask_cors import CORS # type: ignore
from recommendation import recommend

app = Flask(__name__)
CORS(app)

@app.route("/api/recommend", methods=["POST"])
def recommend_route():
    try:
        data = request.get_json()
        group = data["group"]
        top_k = data.get("top_k", 5)
        recommendations = recommend(group, top_k)
        return jsonify(recommendations)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)