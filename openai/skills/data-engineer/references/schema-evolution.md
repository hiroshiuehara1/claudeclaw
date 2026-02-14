# Schema Evolution

Use this guide for safe schema and contract changes across batch and streaming consumers.

## Compatibility Rules

Define compatibility posture per interface:
- Backward compatible: old consumers continue to work
- Forward compatible: new consumers tolerate old producers
- Breaking changes: require version bump and migration plan

Default policy:
- Additive changes preferred (new nullable fields)
- Renames/removals require staged migration
- Type narrowing requires explicit consumer validation

## Event Contract Versioning

For critical events and datasets, define:
- Contract owner
- Contract version metadata
- Required vs optional fields
- Allowed values and semantic constraints
- Producer and consumer compatibility matrix

## Change Classification

Classify every schema change:
- Non-breaking: additive optional field
- Potentially breaking: semantic change or default behavior change
- Breaking: field removal, type incompatibility, key change

## Migration Strategy

Use staged rollout:
1. Publish new schema/version in parallel
2. Dual-read or dual-write if needed
3. Validate consumer readiness and lag behavior
4. Deprecate old schema after explicit window

## Stream-Specific Migration Controls

Include:
- Dual-publish or transform bridge strategy
- Version-aware consumer routing
- Fallback behavior on unknown version events
- Monitoring for version skew and parse failures

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
