class EntitySerializer < Blueprinter::Base
  identifier :id

  field :plan_id, name: :planId
  field :name
  field :entity_type, name: :type
  field :template_key, name: :templateKey
  field :parent_id, name: :parentId
  field :data
  field :created_at, name: :createdAt
  field :updated_at, name: :updatedAt
end
