class Entity < ApplicationRecord
  VALID_TYPES = %w[account debt expense holding income possession].freeze

  belongs_to :plan
  belongs_to :parent, class_name: "Entity", optional: true
  has_many :children, class_name: "Entity", foreign_key: "parent_id", dependent: :nullify
  has_many :ledger_entries, dependent: :destroy

  accepts_nested_attributes_for :ledger_entries, allow_destroy: true

  validates :name, presence: true
  validates :entity_type, presence: true, inclusion: { in: VALID_TYPES }
  validates :template_key, presence: true
end
