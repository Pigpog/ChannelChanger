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

use std::{env, sync::Mutex};
use rusqlite::{Connection, Error, Result};

use serenity::prelude::TypeMapKey;

// Connection needs to be in a struct
// so we can transport it and stuff
pub struct Database;

impl TypeMapKey for Database {
    type Value = Mutex<Connection>;
}

pub fn init() -> Result<Mutex<Connection>, Error> {
    // Connect with our database
    let path = env::var("DATABASE").expect("database_file");
    let conn = Connection::open(&path).unwrap();
    // Enable foreign key constraint enforcement
    conn.execute("PRAGMA foreign_keys=ON;", []).unwrap();

    // Create fresh tables if they dont exist
    conn.execute("CREATE TABLE IF NOT EXISTS guilds (
                    guild_id TEXT PRIMARY KEY,
                    majority INTEGER,
                    template TEXT
                  );", [])?;

    conn.execute("CREATE TABLE IF NOT EXISTS channels (
                    channel_id TEXT,
                    guild_id TEXT,
                    name TEXT NOT NULL,
                    majority INTEGER,
                    template TEXT,
                    PRIMARY KEY (channel_id),
                        FOREIGN KEY (guild_id)
                            REFERENCES guilds (guild_id)
                                ON DELETE CASCADE
                                ON UPDATE NO ACTION
                  );", [])?;

    conn.execute("CREATE TABLE IF NOT EXISTS categories (
                    category_id TEXT PRIMARY KEY,
                    guild_id TEXT,
                    majority INTEGER,
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
    let success = conn.clone().lock().unwrap().execute("INSERT INTO guilds VALUES(?1, NULL, NULL)", [guild_id]);
    match success {
        Ok(_) => println!("Successfully added server"),
        Err(e) => eprintln!("add_guild: Error: {}", e),
    }
}

