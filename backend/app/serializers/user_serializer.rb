class UserSerializer < Blueprinter::Base
  identifier :id

  field :email
  field :name
  field :created_at, name: :createdAt
  field :updated_at, name: :updatedAt
end
