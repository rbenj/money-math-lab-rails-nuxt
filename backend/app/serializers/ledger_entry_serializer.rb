class LedgerEntrySerializer < Blueprinter::Base
  identifier :id

  field :entity_id, name: :entityId
  field :day
  field :amount do |entry|
    entry.amount&.to_f
  end
  field :share_quantity, name: :shareQuantity do |entry|
    entry.share_quantity&.to_f
  end
  field :share_price, name: :sharePrice do |entry|
    entry.share_price&.to_f
  end
  field :created_at, name: :createdAt
  field :updated_at, name: :updatedAt
end
