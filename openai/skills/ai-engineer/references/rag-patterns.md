# RAG Patterns

Use this guide to design reliable retrieval-augmented generation systems.

## Source and Corpus Strategy

Define:
- Authoritative sources and ownership
- Inclusion/exclusion boundaries
- Update and staleness policy
- Document chunking and metadata strategy

## Retrieval Design

Choose retrieval method by signal needs:
- Keyword retrieval for precise term matching
- Vector retrieval for semantic similarity
- Hybrid retrieval for balanced recall and precision
- Reranking for final relevance quality

## Context Assembly

Build context with explicit controls:
- Max context budget and ranking cutoff
- Diversity and de-duplication strategy
- Citation formatting and traceability
- Abstain/escalate behavior when evidence is weak

## Freshness and Invalidations

For changing knowledge:
- Define indexing cadence
- Define stale-content invalidation behavior
- Define fallback when fresh content is unavailable

## Failure Patterns

Plan for:
- Retrieval miss or low confidence
- Contradictory sources
- Long-tail queries with sparse evidence
- Overly broad context causing answer dilution
