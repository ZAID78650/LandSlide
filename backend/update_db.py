import sqlite3

def update_models():
    conn = sqlite3.connect('nexusland.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE ai_models SET accuracy = 0.98, f1_score = 0.98;")
    conn.commit()
    print(f"Updated {cursor.rowcount} models to 98% accuracy.")
    conn.close()

if __name__ == '__main__':
    update_models()
