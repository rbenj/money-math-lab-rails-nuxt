class PlanSerializer < Blueprinter::Base
  identifier :id

  field :user_id, name: :userId
  field :name
  field :birth_date, name: :birthDate
  field :retirement_age, name: :retirementAge
  field :created_at, name: :createdAt
  field :updated_at, name: :updatedAt
end
