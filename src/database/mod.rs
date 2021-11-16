/*
 * ChannelChanger Discord Bot
 * Copyright (C) 2021 Pigpog <7060603@hotmail.ca>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

use std::{
    env,
    sync::Mutex,
    io::{Error, ErrorKind},
};

use rusqlite::{Connection, Result, params};

use serenity::prelude::TypeMapKey;

// Connection needs to be in a struct
// so we can transport it and stuff
pub struct Database;

impl TypeMapKey for Database {
    type Value = Mutex<Connection>;
}

pub fn init() -> Result<Mutex<Connection>, rusqlite::Error> {
    // Connect with our database
    let path = env::var("DATABASE").expect("database_file");
    let conn = Connection::open(&path).unwrap();
    // Enable foreign key constraint enforcement
    conn.execute("PRAGMA foreign_keys=ON;", []).unwrap();

    // Create fresh tables if they dont exist
    conn.execute("
        CREATE TABLE IF NOT EXISTS guilds (
            guild_id INTEGER PRIMARY KEY
        );", [])?;

    conn.execute("
        CREATE TABLE IF NOT EXISTS channels (
            channel_id INTEGER,
            guild_id INTEGER,
            name TEXT NOT NULL,
            template TEXT,
            majority INTEGER,
            PRIMARY KEY (channel_id),
                FOREIGN KEY (guild_id)
                    REFERENCES guilds (guild_id)
                        ON DELETE CASCADE
                        ON UPDATE NO ACTION
        );", [])?;

    conn.execute("
        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY,
            guild_id INTEGER,
            template TEXT,
            FOREIGN KEY (guild_id)
                REFERENCES guilds (guild_id)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
        );", [])?;

    // Temporarily store names of channels in added categories
    conn.execute("
        CREATE TABLE IF NOT EXISTS tmp_channels (
            channel_id INTEGERPRIMARY KEY,
            guild_id INTEGER,
            name TEXT NOT NULL,
            FOREIGN KEY (guild_id)
                REFERENCES guilds (guild_id)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
        );", [])?;
    conn.execute("
        CREATE TABLE IF NOT EXISTS roles (
            role_id INTEGER PRIMARY KEY,
            guild_id INTEGER,
            game TEXT NOT NULL,
            FOREIGN KEY (guild_id)
                REFERENCES guilds (guild_id)
                    ON UPDATE CASCADE
                    ON UPDATE NO ACTION
        );", [])?;


    Ok(Mutex::new(conn))
}

// Adds a guild with no settings to the guilds table
pub fn add_guild(conn: &Mutex<Connection>, guild_id: u64) {
    let success = conn.clone().lock().unwrap().execute("INSERT INTO guilds VALUES(?1)", [guild_id]);
    match success {
        Ok(_) => println!("Successfully added server"),
        Err(e) => eprintln!("add_guild: Error: {}", e),
    }
}

// Deletes a guild from the guilds table
pub fn del_guild(conn: &Mutex<Connection>, guild_id: u64) {
    let success = conn.clone().lock().unwrap().execute("DELETE FROM guilds WHERE guild_id = ?1", [guild_id]);
    match success {
        Ok(_) => println!("Successfully deleted server"),
        Err(e) => eprintln!("add_guild: Error: {}", e),
    }
}

pub fn get_all_guilds(conn: &Mutex<Connection>) -> Result<Vec<u64>> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("SELECT guild_id FROM guilds").unwrap();
    let rows = query.query_map([], |row| row.get(0))?;
    let mut guild_ids = Vec::new();
    for guild_id in rows {
        guild_ids.push(guild_id?);
    }
    Ok(guild_ids)
}

// Adds a channel with no settings to the channels table
pub fn add_channel(conn: &Mutex<Connection>, guild_id: u64, channel_id: u64, name: String) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("INSERT INTO channels VALUES(?1, ?2, ?3, NULL, NULL)").unwrap();

    match query.execute(params![channel_id, guild_id, name]) {
        Ok(_) => {
            println!("Successfully added channel");
            Ok(())
        },
        Err(e) => {
            if e.to_string() == "UNIQUE constraint failed: channels.channel_id" {
                return Err(Error::new(ErrorKind::Other, "Channel already added"));
            }
            eprintln!("add_channel: Error: {}", e);
            return Err(Error::new(ErrorKind::Other, "An unknown error occurred"));
        },
    }
}

// Gets data about a channel
pub fn get_channel(conn: &Mutex<Connection>, channel_id: u64) -> Result<(String, Option<String>)> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("SELECT name, template FROM channels WHERE channel_id = ?")?;
    return query.query_row([channel_id], |row| {
        Ok((row.get(0)?, row.get(1)?))
    });
}

pub fn set_channel_template(conn: &Mutex<Connection>, channel_id: u64, template: String) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("UPDATE channels SET template = ? WHERE channel_id = ?").unwrap();
    match query.execute(params![template, channel_id]) {
        Ok(count) => {
            if count > 0 {
                return Ok(())
            } else {
                return Err(Error::new(ErrorKind::Other, "Channel not enabled. Do `!enable channel` first."));
            }
        },
        Err(e) => {
            return Err(Error::new(ErrorKind::Other, e));
        },
    }
}

pub fn del_channel(conn: &Mutex<Connection>, channel_id: u64) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("DELETE FROM channels WHERE channel_id = ?").unwrap();
    match query.execute([channel_id]) {
        Ok(_) => {
            return Ok(())
        },
        Err(e) => {
            return Err(Error::new(ErrorKind::Other, e));
        },
    }
}

pub fn del_category(conn: &Mutex<Connection>, category_id: u64) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("DELETE FROM categories WHERE category_id = ?").unwrap();
    match query.execute([category_id]) {
        Ok(count) => {
            if count > 0 {
                return Ok(())
            } else {
                return Err(Error::new(ErrorKind::Other, "Category was not added"));
            }
        },
        Err(e) => {
            return Err(Error::new(ErrorKind::Other, e));
        },
    }
}

// Adds a category with no settings to the channels table
pub fn add_category(conn: &Mutex<Connection>, guild_id: u64, category_id: u64) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    match connection.execute("INSERT INTO categories VALUES(?1, ?2, NULL)", [category_id, guild_id]) {
        Ok(_) => {
            println!("Successfully added category");
            Ok(())
        },
        Err(e) => {
            if e.to_string() == "UNIQUE constraint failed: categories.category_id" {
                return Err(Error::new(ErrorKind::Other, "Category already added"));
            }
            eprintln!("add_category: Error: {}", e);
            return Err(Error::new(ErrorKind::Other, "An unknown error occurred"));
        },
    }
}

pub fn get_category(conn: &Mutex<Connection>, category_id: u64) -> Result<Option<String>> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("SELECT template FROM categories WHERE category_id = ?")?;
    return query.query_row([category_id], |row| {
        Ok(row.get(0)?)
    });
}

pub fn set_category_template(conn: &Mutex<Connection>, category_id: u64, template: String) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("UPDATE categories SET template = ? WHERE category_id = ?").unwrap();
    match query.execute(params![template, category_id]) {
        Ok(count) => {
            if count > 0 {
                return Ok(())
            } else {
                return Err(Error::new(ErrorKind::Other, "Category not enabled. Do `!enable category` first."));
            }
        },
        Err(e) => {
            return Err(Error::new(ErrorKind::Other, e));
        },
    }
}

// Gets a tmp_channel's name. For channels in added categories.
pub fn get_tmp_channel(conn: &Mutex<Connection>, channel_id: u64) -> Result<String> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("SELECT name FROM tmp_channels WHERE channel_id = ?")?;
    return query.query_row([channel_id], |row| {
        Ok(row.get(0)?)
    });
}

// Adds a tmp_channel
pub fn add_tmp_channel(conn: &Mutex<Connection>, channel_id: u64, guild_id: u64, name: String) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("INSERT INTO tmp_channels VALUES(?1, ?2, ?3)").unwrap();
    match query.execute(params![channel_id, guild_id, name]) {
        Ok(_) => {
            Ok(())
        },
        Err(e) => {
            if e.to_string() == "UNIQUE constraint failed: tmp_channels.channel_id" {
                return Err(Error::new(ErrorKind::Other, "Channel already added"));
            }
            eprintln!("add_tmp_channel: Error: {}", e);
            return Err(Error::new(ErrorKind::Other, "An unknown error occurred"));
        },
    }
}

pub fn del_tmp_channel(conn: &Mutex<Connection>, channel_id: u64) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("DELETE FROM tmp_channels WHERE channel_id = ?").unwrap();
    match query.execute([channel_id]) {
        Ok(_) => {
            return Ok(())
        },
        Err(e) => {
            return Err(Error::new(ErrorKind::Other, e));
        },
    }
}

pub fn add_role (conn: &Mutex<Connection>, role_id: u64, guild_id: u64, game: String) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("INSERT INTO roles VALUES(?1, ?2, ?3)").unwrap();
    match query.execute(params![role_id, guild_id, game]) {
        Ok(_) => {
            Ok(())
        },
        Err(e) => {
            if e.to_string() == "UNIQUE constraint failed: roles.role_id" {
                return Err(Error::new(ErrorKind::Other, "Role already added"));
            }
            eprintln!("add_role: Error: {}", e);
            return Err(Error::new(ErrorKind::Other, "An unknown error occurred"));
        },
    }
}

pub fn get_role(conn: &Mutex<Connection>, guild_id: u64, game: String) -> Result<u64> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("SELECT role_id FROM roles WHERE guild_id = ? AND game = ?")?;
    return query.query_row(params![guild_id, game], |row| {
        Ok(row.get(0)?)
    });
}

pub fn get_role_by_ids(conn: &Mutex<Connection>, guild_id: u64, role_ids: u64) -> Result<u64> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("SELECT role_id FROM roles WHERE role_id in ?")?;
    return query.query_row([guild_id, role_ids], |row| {
        Ok(row.get(0)?)
    });
}

pub fn del_role(conn: &Mutex<Connection>, role_id: u64) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("DELETE FROM roles WHERE role_id = ?").unwrap();
    match query.execute([role_id]) {
        Ok(_) => {
            return Ok(())
        },
        Err(e) => {
            return Err(Error::new(ErrorKind::Other, e));
        },
    }
}


