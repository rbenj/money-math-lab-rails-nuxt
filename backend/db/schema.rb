# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_29_192307) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "entities", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.jsonb "data", default: {}, null: false
    t.string "entity_type", null: false
    t.string "name", null: false
    t.uuid "parent_id"
    t.uuid "plan_id", null: false
    t.string "template_key", null: false
    t.datetime "updated_at", null: false
    t.index ["entity_type"], name: "index_entities_on_entity_type"
    t.index ["plan_id"], name: "index_entities_on_plan_id"
  end

  create_table "ledger_entries", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount", precision: 15, scale: 2
    t.datetime "created_at", null: false
    t.integer "day", null: false
    t.uuid "entity_id", null: false
    t.decimal "share_price", precision: 15, scale: 6
    t.decimal "share_quantity", precision: 15, scale: 6
    t.datetime "updated_at", null: false
    t.index ["day"], name: "index_ledger_entries_on_day"
    t.index ["entity_id", "day"], name: "index_ledger_entries_on_entity_id_and_day"
    t.index ["entity_id"], name: "index_ledger_entries_on_entity_id"
  end

  create_table "plans", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.date "birth_date"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "retirement_age"
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["user_id"], name: "index_plans_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "entities", "entities", column: "parent_id", on_delete: :nullify
  add_foreign_key "entities", "plans"
  add_foreign_key "ledger_entries", "entities"
  add_foreign_key "plans", "users"
end
