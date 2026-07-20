"""
Prints an ASCII ER diagram of gearshift.db straight to the terminal.

Reads the live SQLite schema (not the model source), so it always matches
whatever tables actually exist on disk. Run with:

    python print_schema.py
"""
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance", "gearshift.db")


def box(title, lines):
    width = max(len(title), *(len(l) for l in lines)) + 2
    top = "+" + "-" * width + "+"
    out = [top, "| " + title.ljust(width - 1) + "|", "+" + "-" * width + "+"]
    for l in lines:
        out.append("| " + l.ljust(width - 1) + "|")
    out.append(top)
    return out


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = sorted(row[0] for row in cur.fetchall())

    print(f"GearShift DB schema  ({DB_PATH})\n")

    fk_edges = []

    for table in tables:
        cur.execute(f"PRAGMA table_info('{table}')")
        cols = cur.fetchall()  # cid, name, type, notnull, dflt_value, pk

        cur.execute(f"PRAGMA foreign_key_list('{table}')")
        fks = {row[3]: row[2] for row in cur.fetchall()}  # {from_col: ref_table}

        lines = []
        for _, name, ctype, notnull, _, pk in cols:
            markers = []
            if pk:
                markers.append("PK")
            if name in fks:
                markers.append(f"FK -> {fks[name]}")
                fk_edges.append((table, name, fks[name]))
            marker = f" [{', '.join(markers)}]" if markers else ""
            lines.append(f"{name} {ctype}{marker}")

        for l in box(table, lines):
            print(l)
        print()

    print("Relationships:")
    for table, col, ref in fk_edges:
        print(f"  {table}.{col} --> {ref}.id")


if __name__ == "__main__":
    main()
