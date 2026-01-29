class CreateEntities < ActiveRecord::Migration[8.1]
  def change
    create_table :entities, id: :uuid do |t|
      t.references :plan, null: false, foreign_key: true, type: :uuid
      t.string :name, null: false
      t.string :entity_type, null: false
      t.string :template_key, null: false
      t.uuid :parent_id
      t.jsonb :data, null: false, default: {}

      t.timestamps
    end

    add_index :entities, :entity_type
    add_foreign_key :entities, :entities, column: :parent_id, on_delete: :nullify
  end
end
