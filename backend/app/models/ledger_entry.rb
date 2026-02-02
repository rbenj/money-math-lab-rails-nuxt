class LedgerEntry < ApplicationRecord
  belongs_to :entity

  validates :day, presence: true, numericality: { only_integer: true }

  scope :chronological, -> { order(:day) }
end
