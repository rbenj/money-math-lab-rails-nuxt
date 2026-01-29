class CreateLedgerEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :ledger_entries, id: :uuid do |t|
      t.references :entity, null: false, foreign_key: true, type: :uuid
      t.integer :day
      t.decimal :amount
      t.decimal :share_quantity
      t.decimal :share_price

      t.timestamps
    end
  end
end
