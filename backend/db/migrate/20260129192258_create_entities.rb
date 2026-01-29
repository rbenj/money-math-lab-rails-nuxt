class CreateEntities < ActiveRecord::Migration[8.1]
  def change
    create_table :entities, id: :uuid do |t|
      t.references :plan, null: false, foreign_key: true, type: :uuid
      t.string :name
      t.string :entity_type
      t.string :template_key
      t.uuid :parent_id
      t.jsonb :data

      t.timestamps
    end
  end
end
