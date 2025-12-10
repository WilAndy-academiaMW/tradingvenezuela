import sqlite3

def init_db():
    conn = sqlite3.connect("portfolio.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inversiones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT,
            valor REAL
        )
    """)
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
