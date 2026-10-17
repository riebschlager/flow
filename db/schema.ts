import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
export const tracks = sqliteTable("tracks", {
 id: text("id").primaryKey(), owner: text("owner").notNull(), title: text("title").notNull(), artist: text("artist").notNull(),
 objectKey: text("object_key").notNull(), created: integer("created").notNull(), duration: integer("duration").notNull(), bytes: integer("bytes").notNull(),
}, t => [index("tracks_created").on(t.created), index("tracks_owner_created").on(t.owner,t.created)]);
export const likes = sqliteTable("likes", {
 track: text("track").notNull().references(()=>tracks.id,{onDelete:"cascade"}), user: text("user").notNull(), created: integer("created").notNull(), active: integer("active").notNull().default(1),
}, t=>[primaryKey({columns:[t.track,t.user]}),index("likes_created_track").on(t.created,t.track)]);
export const writeLimits = sqliteTable("write_limits", {user: text("user").primaryKey(), window: integer("window").notNull(), count: integer("count").notNull()});
