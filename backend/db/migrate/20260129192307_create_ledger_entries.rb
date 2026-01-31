class CreateLedgerEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :ledger_entries, id: :uuid do |t|
      t.references :entity, null: false, foreign_key: true, type: :uuid
      t.integer :day, null: false
      t.decimal :amount, precision: 15, scale: 2
      t.decimal :share_quantity, precision: 15, scale: 6
      t.decimal :share_price, precision: 15, scale: 6

      t.timestamps
    end

    add_index :ledger_entries, :day
    add_index :ledger_entries, [ :entity_id, :day ]
  end
end
