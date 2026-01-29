class LedgerEntry < ApplicationRecord
  belongs_to :entity

  validates :day, presence: true, numericality: { only_integer: true }

  default_scope { order(:day) }
end
