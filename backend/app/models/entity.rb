class Entity < ApplicationRecord
  belongs_to :plan
  belongs_to :parent, class_name: 'Entity', optional: true
  has_many :children, class_name: 'Entity', foreign_key: 'parent_id', dependent: :nullify
  has_many :ledger_entries, dependent: :destroy

  validates :name, presence: true
  validates :entity_type, presence: true
  validates :template_key, presence: true
end

