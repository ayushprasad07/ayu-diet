import pandas as pd
import numpy as np
import json
import random
import sys
import os
from joblib import dump, load
from sklearn.preprocessing import LabelEncoder
from sklearn.cluster import KMeans

# ================================================
# CONFIGURATION
# ================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RECIPES_CSV = os.path.join(BASE_DIR, "recipes.csv")
DOSHA_JSON = os.path.join(BASE_DIR, "dosha_ingredients.json")
MODEL_FILE = os.path.join(BASE_DIR, "kmeans_model.joblib")

# ================================================
# DATA LOADING
# ================================================
def load_recipes(csv_path: str) -> pd.DataFrame:
    """Load the updated recipes CSV file."""
    try:
        df = pd.read_csv(csv_path)
        required_columns = [
            "id", "title", "ingredients", "instructions", "cook_time",
            "image_url", "calories", "protein", "carbs", "fat", "sugar",
            "fiber", "dosha_vata", "dosha_pitta", "dosha_kapha", "health_score"
        ]
        for col in required_columns:
            if col not in df.columns:
                raise RuntimeError(f"Missing column: {col}")
        df.dropna(subset=["title", "ingredients"], inplace=True)
        return df
    except Exception as e:
        raise RuntimeError(f"Error loading recipes CSV: {e}")


def load_dosha_db(json_path: str) -> dict:
    """Load dosha-ingredient mapping JSON."""
    try:
        with open(json_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError(f"Error loading dosha ingredient JSON: {e}")


# ================================================
# FEATURE ENCODING + CLUSTERING MODEL
# ================================================
def preprocess_ingredients(df: pd.DataFrame) -> pd.DataFrame:
    """Encode ingredients for clustering."""
    df = df.copy()
    all_ingredients = sorted(
        list(set(ing.strip().lower() for ings in df["ingredients"] for ing in ings.split(",")))
    )
    encoder = LabelEncoder()
    encoder.fit(all_ingredients)
    df["encoded"] = df["ingredients"].apply(
        lambda x: np.mean(
            [
                encoder.transform([i.strip().lower()])[0]
                for i in x.split(",")
                if i.strip().lower() in encoder.classes_
            ]
        )
    )
    return df


def train_model(df: pd.DataFrame, n_clusters: int = 3):
    """Train or load KMeans model."""
    if os.path.exists(MODEL_FILE):
        return load(MODEL_FILE)

    df_encoded = preprocess_ingredients(df)
    X = df_encoded[["encoded"]].values
    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    model.fit(X)
    dump(model, MODEL_FILE)
    return model


# ================================================
# DOSHA MATCHING + RECOMMENDATION
# ================================================
def recommend_recipes(df: pd.DataFrame, dosha: str, avoid_list: list, num_recipes: int = 3):
    """Recommend recipes for a given dosha and avoid list."""
    dosha_col = f"dosha_{dosha.lower()}"
    if dosha_col not in df.columns:
        raise ValueError(f"Invalid dosha type: {dosha}")

    # Filter recipes where dosha column > 0 or marked as suitable
    df_filtered = df[df[dosha_col] > 0]

    # Remove unwanted ingredients
    if avoid_list:
        pattern = "|".join([a.strip().lower() for a in avoid_list if a.strip()])
        df_filtered = df_filtered[~df_filtered["ingredients"].str.lower().str.contains(pattern, na=False)]

    if df_filtered.empty:
        return []

    # Pick top recipes by health score
    top_recipes = df_filtered.sort_values("health_score", ascending=False).head(num_recipes)
    return top_recipes[
        ["id", "title", "ingredients", "image_url", "calories", "protein", "carbs", "fat", "health_score"]
    ].to_dict(orient="records")


def generate_weekly_plan(df: pd.DataFrame, dosha: str, avoid_list: list, meals_per_day: int = 3):
    """Generate a 7-day meal plan for the selected dosha."""
    plan = {}
    for day in range(1, 8):
        plan[f"Day {day}"] = recommend_recipes(df, dosha, avoid_list, meals_per_day)
    return plan


# ================================================
# CLI MODE (Manual Run)
# ================================================
def main():
    print("🪔 Ayurved Diet Planner (Manual Mode)")
    df = load_recipes(RECIPES_CSV)
    dosha_db = load_dosha_db(DOSHA_JSON)
    _ = train_model(df)

    dosha = input("Enter your dosha (vata/pitta/kapha): ").strip().lower()
    avoid = input("Enter ingredients to avoid (comma separated): ").strip().lower().split(",")

    plan = generate_weekly_plan(df, dosha, avoid)
    print(json.dumps(plan, indent=2))


# ================================================
# BACKEND MODE (Next.js API Integration)
# ================================================
def generate_diet_from_input(input_file: str):
    """Generate diet plan for API request."""
    try:
        with open(input_file, "r") as f:
            config = json.load(f)

        dosha = config.get("dosha", "vata")
        avoid_list = config.get("avoid", [])

        df = load_recipes(RECIPES_CSV)
        _ = train_model(df)

        plan = generate_weekly_plan(df, dosha, avoid_list)
        print(json.dumps({"success": True, "dosha": dosha, "plan": plan}, indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


# ================================================
# ENTRY POINT
# ================================================
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
        generate_diet_from_input(sys.argv[1])
    else:
        main()
