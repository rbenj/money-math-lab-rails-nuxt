class CreatePlans < ActiveRecord::Migration[8.1]
  def change
    create_table :plans, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :name
      t.date :birth_date
      t.integer :retirement_age

      t.timestamps
    end
  end
end
