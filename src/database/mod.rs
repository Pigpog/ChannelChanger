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

use rusqlite::{Connection, Result};

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
            guild_id TEXT PRIMARY KEY
        );", [])?;

    conn.execute("
        CREATE TABLE IF NOT EXISTS channels (
            channel_id TEXT,
            guild_id TEXT,
            name TEXT NOT NULL,
            template TEXT,
            PRIMARY KEY (channel_id),
                FOREIGN KEY (guild_id)
                    REFERENCES guilds (guild_id)
                        ON DELETE CASCADE
                        ON UPDATE NO ACTION
        );", [])?;

    conn.execute("
        CREATE TABLE IF NOT EXISTS categories (
            category_id TEXT PRIMARY KEY,
            guild_id TEXT,
            template TEXT,
            FOREIGN KEY (guild_id)
                REFERENCES guilds (guild_id)
                    ON DELETE CASCADE
                    ON UPDATE NO ACTION
        );", [])?;

    Ok(Mutex::new(conn))
}

// Adds a guild with no settings to the guilds table
pub fn add_guild(conn: &Mutex<Connection>, guild_id: String) {
    let success = conn.clone().lock().unwrap().execute("INSERT INTO guilds VALUES(?1)", [guild_id]);
    match success {
        Ok(_) => println!("Successfully added server"),
        Err(e) => eprintln!("add_guild: Error: {}", e),
    }
}

// Deletes a guild from the guilds table
pub fn del_guild(conn: &Mutex<Connection>, guild_id: String) {
    let success = conn.clone().lock().unwrap().execute("DELETE FROM guilds WHERE guild_id = ?1", [guild_id]);
    match success {
        Ok(_) => println!("Successfully deleted server"),
        Err(e) => eprintln!("add_guild: Error: {}", e),
    }
}

// Adds a channel with no settings to the channels table
pub fn add_channel(conn: &Mutex<Connection>, guild_id: String, channel_id: String, name: String) -> Result<(), Error> {
    let connection = conn.clone().lock().unwrap();
    let mut query = connection.prepare_cached("INSERT INTO channels VALUES(?1, ?2, ?3, NULL)").unwrap();
    //match connection.execute("INSERT INTO channels VALUES(?1, ?2, ?3, NULL)", [channel_id, guild_id, name]) {
    match query.execute([channel_id, guild_id, name]) {
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
pub fn get_channel(conn: &Mutex<Connection>, channel_id: String) -> Result<(String, Option<String>)> {
    let connection = conn.clone().lock().unwrap();
    return connection.query_row("SELECT name, template FROM channels WHERE channel_id = ?", [channel_id], |row| {
        Ok((row.get(0)?, row.get(1)?))
    });
}

// Adds a category with no settings to the channels table
pub fn add_category(conn: &Mutex<Connection>, guild_id: String, category_id: String) -> Result<(), Error> {
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
