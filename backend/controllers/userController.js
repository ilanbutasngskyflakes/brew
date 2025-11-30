import db from "../config/db.js";
import bcrypt from "bcrypt";

// Get users
export const getUsers = async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, name, first_name, last_name, role FROM tbl_users"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot get users" });
  }
};

// Get user by id
export const getUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id || req.query.id, 10);
    if (!id) return res.status(400).json({ message: "User id is required" });

    const [rows] = await db.execute(
      "SELECT id, name, first_name, last_name, role, created_at FROM tbl_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Database error." });
  }
};

// sign in / add user
export const addUser = async (req, res) => {
  try {
    const { name, first_name, last_name, password, role } = req.body;

    if (!name || !first_name || !last_name || !password || !role) {
      return res.status(400).json({
        message: "name, First and Last name, Password, Role are required",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO tbl_users (name, first_name, last_name, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, first_name, last_name, hashed, role]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      first_name,
      last_name,
      role,
      message: "User added",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error." });
  }
};

// log in / verify user
export const verifyUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({ message: "name and password required" });
    }

    const [rows] = await db.execute(
      "SELECT id, name, first_name, last_name, password, role FROM tbl_users WHERE name = ? LIMIT 1",
      [name]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];
    const stored = user.password || "";

    const match =
      typeof stored === "string" && stored.startsWith("$2")
        ? await bcrypt.compare(password, stored)
        : password === stored;

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    delete user.password;
    return res.json({ message: "Login successful", user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Database error." });
  }
};

// update user
export const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id || req.body.id, 10);
    if (!id) return res.status(400).json({ message: "User id is required" });

    const { name, first_name, last_name, role } = req.body;
    const fields = [];
    const values = [];

    if (name !== undefined) {
      fields.push("name = ?");
      values.push(name);
    }
    if (first_name !== undefined) {
      fields.push("first_name = ?");
      values.push(first_name);
    }
    if (last_name !== undefined) {
      fields.push("last_name = ?");
      values.push(last_name);
    }
    if (role !== undefined) {
      fields.push("role = ?");
      values.push(role);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(id);
    const sql = `UPDATE tbl_users SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await db.execute(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User updated" });
  } catch (error) {
    console.error(error);
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "name already exists" });
    }
    return res.status(500).json({ message: "Database error." });
  }
};

// delete user (hard delete)
export const deleteUser = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    if (!id) return res.status(400).json({ message: "User id is required" });

    const [result] = await db.execute("DELETE FROM tbl_users WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Database error." });
  }
};

// change password
export const changePassword = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const { current_password, new_password } = req.body;

    if (!id || !current_password || !new_password) {
      return res.status(400).json({
        message: "id, current_password and new_password are required",
      });
    }
    if (new_password.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters" });
    }

    const [rows] = await db.execute(
      "SELECT password FROM tbl_users WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const stored = rows[0].password || "";
    const match =
      typeof stored === "string" && stored.startsWith("$2")
        ? await bcrypt.compare(current_password, stored)
        : current_password === stored;

    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await db.execute("UPDATE tbl_users SET password = ? WHERE id = ?", [
      hashed,
      id,
    ]);

    return res.json({ message: "Password changed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Database error." });
  }
};

