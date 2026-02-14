# Schema Evolution

Use this guide for safe schema and contract changes.

## Compatibility Rules

Define compatibility posture per interface:
- Backward compatible: old consumers continue to work
- Forward compatible: new consumers tolerate old producers
- Breaking changes: require version bump and migration plan

Default policy:
- Additive changes preferred (new nullable fields)
- Renames/removals require staged migration
- Type narrowing requires explicit consumer validation

## Versioning and Contracts

For critical datasets, define:
- Contract owner
- Contract version field or metadata
- Required vs optional fields
- Allowed values and semantic constraints

## Change Classification

Classify every schema change:
- Non-breaking: additive optional field
- Potentially breaking: semantic change or default behavior change
- Breaking: field removal, type incompatibility, key change

## Migration Strategy

Use staged rollout:
1. Publish new schema/version in parallel
2. Dual-read or dual-write if needed
3. Validate consumer readiness
4. Deprecate old schema after explicit window

## Deprecation Windows

Set explicit deprecation windows per consumer criticality.
Include:
- Notice date
- Enforcement date
- Rollback path

## Communication Checklist

Before rollout:
- Consumer inventory complete
- Contract diff published
- Validation plan agreed

After rollout:
- Compatibility metrics monitored
- Error rates for old/new schema tracked
- Deprecation completion confirmed
