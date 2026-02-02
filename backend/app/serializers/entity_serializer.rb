class EntitySerializer < Blueprinter::Base
  identifier :id

  field :plan_id, name: :planId
  field :name
  field :entity_type, name: :type # Map outgoing 'entity_type' to 'type' for frontend
  field :template_key, name: :templateKey
  field :parent_id, name: :parentId
  field :data do |entity|
    entity.data&.deep_transform_keys { |key| key.to_s.camelize(:lower) }
  end
  field :created_at, name: :createdAt
  field :updated_at, name: :updatedAt

  view :with_ledger_entries do
    association :ledger_entries, blueprint: LedgerEntrySerializer, name: :ledgerEntries do |entity, _options|
      entity.ledger_entries.chronological
    end
  end
end
