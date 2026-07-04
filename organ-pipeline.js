(() => {
  const ORGAN_DEFINITIONS = Object.freeze({
    Energy: {
      boundary: "computational energy fluctuation",
      facts: ["script_burst", "long_task", "resource_storm", "cpu_spike", "frame_drop", "render_block", "gc_pause", "memory_spike"],
      edges: ["temporal_sequence", "burst_sequence", "storm_cluster"],
      components: ["waveform", "indicator", "indicator", "graph"]
    },
    Flow: {
      boundary: "chain/flow movement",
      facts: ["network_chain", "request_burst", "latency_spike", "packet_loss", "flow_block", "flow_storm", "retry_chain"],
      edges: ["flow_link", "temporal_sequence", "storm_cluster"],
      components: ["graph", "waveform", "hotspot map", "overlay"]
    },
    Supply: {
      boundary: "resource supply",
      facts: ["resource_load", "cdn_region_supply", "fetch_retry", "resource_break", "region_outage", "supply_wave"],
      edges: ["temporal_sequence", "dependency_link", "storm_cluster"],
      components: ["map", "indicator", "waveform", "density plot"]
    },
    Value: {
      boundary: "experience/value-path break",
      facts: ["layout_shift", "forced_style_recalc", "cascade_conflict", "selector_conflict", "specificity_conflict", "a11y_break", "a11y_conflict", "vdom_break", "interaction_break", "value_break", "experience_drop", "retention_path_break"],
      edges: ["temporal_sequence", "burst_sequence", "storm_cluster"],
      components: ["map", "waveform", "graph", "overlay"]
    },
    Behavior: {
      boundary: "observable site behavior",
      facts: ["site_behavior_event", "site_behavior_burst", "behavior_storm", "behavior_break", "behavior_pattern"],
      edges: ["burst_sequence", "storm_cluster", "temporal_sequence"],
      components: ["hotspot map", "graph", "waveform", "indicator"]
    },
    Lifecycle: {
      boundary: "object/module lifecycle",
      facts: ["module_reload", "script_lifecycle", "resource_lifecycle", "object_expire", "session_expire", "lifecycle_wave"],
      edges: ["temporal_sequence", "dependency_link", "storm_cluster"],
      components: ["waveform", "graph", "indicator", "hotspot map"]
    },
    Topology: {
      boundary: "structural mutation",
      facts: ["dom_mutation", "ui_reflow", "structure_block", "topology_break", "layout_recalc", "structure_wave"],
      edges: ["mutation_link", "temporal_sequence", "storm_cluster"],
      components: ["graph", "map", "indicator", "waveform"]
    },
    Dependency: {
      boundary: "dependency relationships",
      facts: ["dependency_chain", "module_dependency", "api_dependency", "dependency_storm", "dependency_center"],
      edges: ["dependency_link", "temporal_sequence", "storm_cluster"],
      components: ["graph", "map", "hotspot map", "density plot"]
    },
    Rhythm: {
      boundary: "rhythm fluctuation",
      facts: ["layout_rhythm", "forced_reflow", "style_recalc", "css_animation", "css_transition", "js_event_loop_render", "js_event_loop_idle", "js_microtask", "js_block", "vdom_commit", "vdom_update", "frame_rhythm", "interaction_rhythm", "resource_rhythm", "rhythm_break", "rhythm_storm"],
      edges: ["rhythm_phase", "temporal_sequence", "storm_cluster"],
      components: ["waveform", "indicator", "hotspot map", "overlay"]
    }
  });

  const ORGAN_ORDER = Object.freeze(Object.keys(ORGAN_DEFINITIONS));
  const FACT_TO_ORGAN = Object.freeze(ORGAN_ORDER.reduce((map, organ) => {
    for (const factType of ORGAN_DEFINITIONS[organ].facts) map[factType] = organ;
    return map;
  }, {}));

  const UI_LABELS = Object.freeze({
    Energy: ["Energy Waveform", "Energy Leak Points", "Energy Burst Peaks", "Energy Storm Path"],
    Flow: ["Flow Topology Map", "Latency Waveform", "Flow Storm Map", "Retry Chain Visualization"],
    Supply: ["Regional Supply Map", "Resource Break Indicators", "Supply Waveform", "Fetch Retry Density Map"],
    Value: ["Value Break Map", "Experience Waveform", "Retention Path Visualization", "Interaction Break Overlay"],
    Behavior: ["Site Behavior Storm Map", "Runtime Pattern Graph", "Change Burst Timeline", "Behavior Break Indicators"],
    Lifecycle: ["Lifecycle Waveform", "Reload Path Visualization", "Expiration Indicators", "Lifecycle Storm Map"],
    Topology: ["Topology Mutation Graph", "UI Reflow Map", "Structure Break Indicators", "Topology Waveform"],
    Dependency: ["Dependency Graph", "Dependency Center Map", "Storm Visualization", "Chain Density Map"],
    Rhythm: ["Rhythm Waveform", "Rhythm Break Indicators", "Rhythm Storm Map", "Rhythm Phase Visualization"]
  });

  class OrganDispatcher {
    dispatch(fact) {
      if (!fact?.type) return { ok: false, code: "DISPATCH_ERROR_UNKNOWN_FACT_TYPE", reason: "fact.type is undefined" };
      const organ = FACT_TO_ORGAN[fact.type];
      if (!organ) return { ok: false, code: "DISPATCH_ERROR_UNKNOWN_FACT_TYPE", factType: fact.type };
      return { ok: true, assignment: { fact_id: fact.id, organ } };
    }
  }

  class OrganGraphBuilder {
    constructor(snapshot = {}) {
      this.graphs = createEmptyGraphs(snapshot.graphs);
      this.errors = Array.isArray(snapshot.errors) ? snapshot.errors.slice(-80) : [];
      this.assignments = Array.isArray(snapshot.assignments) ? snapshot.assignments.slice(-160) : [];
      this.dispatcher = new OrganDispatcher();
    }

    process(rawFact, envelope = {}) {
      const normalized = normalizeOrganFact(rawFact, envelope);
      const dispatch = this.dispatcher.dispatch(normalized);
      if (!dispatch.ok) {
        const error = { timestamp: Date.now(), code: dispatch.code, fact_id: normalized.id, fact_type: normalized.type || "", reason: dispatch.reason || "Unknown fact type" };
        this.errors = [error, ...this.errors].slice(0, 80);
        return { ok: false, normalized, error, snapshot: this.snapshot() };
      }
      this.assignments = [dispatch.assignment, ...this.assignments].slice(0, 160);
      const graph = this.graphs[dispatch.assignment.organ];
      const node = createGraphNode(normalized);
      graph.nodes.push(node);
      graph.timestamps.push(node.timestamp);
      graph.timestamps.sort((left, right) => left - right);
      appendOrganEdges(graph, node, ORGAN_DEFINITIONS[dispatch.assignment.organ].edges);
      trimGraph(graph);
      return { ok: true, normalized, assignment: dispatch.assignment, graph, renderBlock: createRenderBlock(graph), snapshot: this.snapshot() };
    }

    snapshot() {
      const renderBlocks = Object.fromEntries(ORGAN_ORDER.map(organ => [organ, createRenderBlock(this.graphs[organ])]));
      const structure = buildStructureEngineSnapshot(this.graphs, this.errors);
      return {
        version: "organ-structural-rendering-v2",
        generatedAt: Date.now(),
        definitions: ORGAN_DEFINITIONS,
        assignments: this.assignments,
        graphs: this.graphs,
        renderBlocks,
        errors: this.errors,
        summary: summarizeOrganGraphs(this.graphs, this.errors),
        structureEngine: structure
      };
    }
  }

  function createEmptyGraphs(existing = {}) {
    return Object.fromEntries(ORGAN_ORDER.map(organ => {
      const graph = existing[organ] || {};
      return [organ, {
        organ_id: organ,
        nodes: Array.isArray(graph.nodes) ? graph.nodes.slice(-120) : [],
        edges: Array.isArray(graph.edges) ? graph.edges.slice(-240) : [],
        timestamps: Array.isArray(graph.timestamps) ? graph.timestamps.slice(-120).sort((a, b) => a - b) : []
      }];
    }));
  }

  function normalizeOrganFact(rawFact = {}, envelope = {}) {
    const timestamp = Number(rawFact.timestamp) || Date.now();
    const type = adaptFactType(rawFact);
    const id = rawFact.id || stableHash(JSON.stringify({
      timestamp,
      source: rawFact.source,
      type: rawFact.type,
      page: envelope.page?.url || rawFact.context?.pageUrl || "",
      value: rawFact.value,
      metadata: rawFact.metadata
    }));
    return {
      id,
      type,
      timestamp,
      payload: sanitizePayload({
        source: rawFact.source || "",
        raw_type: rawFact.type || "",
        value: rawFact.value || {},
        metadata: rawFact.metadata || {},
        context: rawFact.context || {},
        envelope
      })
    };
  }

  function adaptFactType(fact = {}) {
    const source = String(fact.source || "").toLowerCase();
    const type = String(fact.type || "").toLowerCase();
    const value = fact.value || {};
    if (source === "dom") {
      if (/mutation|child|attribute|text/.test(type)) return type.includes("burst") ? "structure_wave" : "dom_mutation";
      if (/stylesheet|reflow/.test(type)) return "ui_reflow";
      return "dom_mutation";
    }
    if (source === "layout") {
      if (/shift/.test(type)) return "layout_shift";
      if (/forced|reflow/.test(type)) return "forced_reflow";
      if (/rhythm|frame/.test(type)) return "layout_rhythm";
      if (/dependency|edge/.test(type)) return "dom_mutation";
      if (/stacking|paint|type/.test(type)) return "behavior_pattern";
      return "layout_rhythm";
    }
    if (source === "vdom") {
      if (/commit|update/.test(type)) return type.includes("commit") ? "vdom_commit" : "vdom_update";
      if (/diff|props|state/.test(type)) return "vdom_diff";
      if (/break/.test(type)) return "vdom_break";
      if (/topology/.test(type)) return "dom_mutation";
      return "vdom_update";
    }
    if (source === "cssom") {
      if (/rule.*insert|rule.*delete|dynamic/.test(type)) return type.includes("delete") ? "css_rule_delete" : "css_rule_insert";
      if (/animation/.test(type)) return "css_animation";
      if (/transition/.test(type)) return "css_transition";
      if (/recalc/.test(type)) return type.includes("forced") ? "forced_style_recalc" : "style_recalc";
      if (/conflict|cascade|specificity|selector/.test(type)) return type.includes("selector") ? "selector_conflict" : "cascade_conflict";
      return "css_animation";
    }
    if (source === "a11y") {
      if (/break|missing|conflict/.test(type)) return type.includes("conflict") ? "a11y_conflict" : "a11y_break";
      if (/role|state/.test(type)) return type.includes("role") ? "a11y_role_change" : "a11y_state_change";
      if (/topology|edge/.test(type)) return "dom_mutation";
      return "a11y_break";
    }
    if (source === "shadow") {
      if (/root/.test(type)) return "dom_mutation";
      if (/slot/.test(type)) return "behavior_pattern";
      return "topology_break";
    }
    if (source === "multicontext") {
      if (/iframe.*created|worker.*created|channel.*created|sw_register/.test(type)) return "dependency_chain";
      if (/iframe|worker|message|sw_|post_message/.test(type)) return "network_chain";
      return "dependency_chain";
    }
    if (source === "network") {
      if (/retry/.test(type) || Number(value.retryCount) > 0) return "retry_chain";
      if (/burst/.test(type)) return "request_burst";
      if (/error|block/.test(type) || [403, 429, 503].includes(Number(value.status))) return "flow_block";
      if (/resource|load/.test(type)) return "resource_load";
      return "network_chain";
    }
    if (source === "storage") {
      if (/expire|clear/.test(type)) return "object_expire";
      return "resource_lifecycle";
    }
    if (source === "runtime") {
      if (/js_fetch|js_ws/.test(type)) return "network_chain";
      if (/js_promise_chain/.test(type)) return "dependency_chain";
      if (/js_event_loop|js_microtask|js_block/.test(type)) return /block/.test(type) ? "rhythm_break" : "frame_rhythm";
      if (type === "long-task") return "long_task";
      if (/script-error|unhandled-rejection|error/.test(type)) return "render_block";
      if (/navigation/.test(type)) return "module_reload";
      if (/page-lifecycle|collector-state/.test(type)) return "script_lifecycle";
      if (/console/.test(type)) return "script_burst";
      return "lifecycle_wave";
    }
    if (source === "performance") {
      if (/long-task/.test(type)) return "long_task";
      if (/frame/.test(type)) return "frame_rhythm";
      if (/memory/.test(type)) return "memory_spike";
      return "cpu_spike";
    }
    if (source === "crawler") {
      if (/timing|regularity|cadence/.test(type)) return "resource_rhythm";
      if (/burst|storm/.test(type)) return "behavior_storm";
      return "behavior_pattern";
    }
    if (source === "anti_crawler") {
      if (/challenge|block/.test(type)) return "structure_block";
      if (/fingerprint|provider|dependency/.test(type)) return "dependency_center";
      return "topology_break";
    }
    if (source === "interaction" || /click|movement|interaction/.test(type)) {
      if (fact.metadata?.observerLocal || fact.value?.observerLocal) return "";
      if (/click.*burst|burst/.test(type)) return "site_behavior_burst";
      if (/movement/.test(type)) return "site_behavior_burst";
      if (/break/.test(type)) return "interaction_break";
      return "site_behavior_event";
    }
    return "";
  }

  function createGraphNode(fact) {
    return {
      id: fact.id,
      fact_type: fact.type,
      timestamp: fact.timestamp,
      payload: fact.payload
    };
  }

  function appendOrganEdges(graph, node, allowedEdges) {
    const previous = graph.nodes[graph.nodes.length - 2];
    if (previous) graph.edges.push({ from: previous.id, to: node.id, relation: "temporal_sequence" });
    const previousSameType = [...graph.nodes].reverse().find(candidate => candidate.id !== node.id && candidate.fact_type === node.fact_type);
    const relation = preferredRelation(node.fact_type, allowedEdges);
    if (previousSameType && relation !== "temporal_sequence") graph.edges.push({ from: previousSameType.id, to: node.id, relation });
  }

  function preferredRelation(factType, allowedEdges) {
    if (/burst/.test(factType) && allowedEdges.includes("burst_sequence")) return "burst_sequence";
    if (/storm/.test(factType) && allowedEdges.includes("storm_cluster")) return "storm_cluster";
    if (/dependency|api|module/.test(factType) && allowedEdges.includes("dependency_link")) return "dependency_link";
    if (/network|flow|retry/.test(factType) && allowedEdges.includes("flow_link")) return "flow_link";
    if (/dom|topology|structure|reflow|layout/.test(factType) && allowedEdges.includes("mutation_link")) return "mutation_link";
    if (/rhythm|frame/.test(factType) && allowedEdges.includes("rhythm_phase")) return "rhythm_phase";
    return allowedEdges.includes("storm_cluster") && /wave/.test(factType) ? "storm_cluster" : "temporal_sequence";
  }

  function trimGraph(graph) {
    if (graph.nodes.length <= 120) return;
    const keep = new Set(graph.nodes.slice(-120).map(node => node.id));
    graph.nodes = graph.nodes.filter(node => keep.has(node.id));
    graph.edges = graph.edges.filter(edge => keep.has(edge.from) && keep.has(edge.to)).slice(-240);
    graph.timestamps = graph.nodes.map(node => node.timestamp).sort((a, b) => a - b);
  }

  function createRenderBlock(graph) {
    const definition = ORGAN_DEFINITIONS[graph.organ_id];
    const labels = UI_LABELS[graph.organ_id];
    return {
      organ_id: graph.organ_id,
      components: definition.components.map((type, index) => ({
        type,
        label: labels[index],
        data: {
          organ_id: graph.organ_id,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          latestTimestamp: graph.timestamps.at(-1) || null
        },
        render_rules: renderRulesFor(graph.organ_id, type)
      }))
    };
  }

  function renderRulesFor(organ, type) {
    const common = ["pure structural rendering", "no scoring", "no interpretation", "deterministic"];
    const organRules = {
      Energy: ["bursts render as spikes", "long tasks render as plateaus", "storms render as connected peaks"],
      Flow: ["chains render as directed edges", "storms render as heat regions"],
      Supply: ["breaks render as red nodes", "waves render as oscillation"],
      Value: ["breaks render as discontinuities"],
      Behavior: ["storms render as clusters"],
      Lifecycle: ["reloads render as jumps"],
      Topology: ["mutations render as node changes"],
      Dependency: ["chains render as directed edges"],
      Rhythm: ["breaks render as discontinuities"]
    };
    return { type, rules: [...(organRules[organ] || []), ...common] };
  }

  function summarizeOrganGraphs(graphs, errors) {
    const organs = ORGAN_ORDER.map(organ => ({
      organ,
      nodeCount: graphs[organ].nodes.length,
      edgeCount: graphs[organ].edges.length,
      lastTimestamp: graphs[organ].timestamps.at(-1) || null
    }));
    return {
      organCount: ORGAN_ORDER.length,
      nodeCount: organs.reduce((sum, item) => sum + item.nodeCount, 0),
      edgeCount: organs.reduce((sum, item) => sum + item.edgeCount, 0),
      errorCount: errors.length,
      organs
    };
  }

  function buildStructureEngineSnapshot(graphs, errors) {
    const organ9 = buildOrgan9(graphs);
    const frequency4 = compressOrgan9(organ9);
    const closure = buildClosure(frequency4, graphs);
    const hexagram = mapClosureToHexagram(closure);
    const signature = generateClosureSignature(closure, hexagram, errors);
    return {
      version: "structure-engine-organ9-frequency4-closure-v1",
      organ9,
      frequency4,
      closure,
      hexagram,
      signature,
      verification: verifySignature(signature, closure),
      comparison: compareSignatures(signature, previousSignatureFromGraphs(graphs)),
      sovereignty: buildSovereigntySystem(signature),
      reconstruction: reconstructHistory(signature, organ9),
      prediction: predictFuture(signature, frequency4)
    };
  }

  function buildOrgan9(graphs) {
    return Object.fromEntries(ORGAN_ORDER.map(organ => {
      const graph = graphs[organ] || { nodes: [], edges: [], timestamps: [] };
      const levels = graph.nodes.length;
      const edgeDensity = levels ? graph.edges.length / Math.max(1, levels) : 0;
      const volatility = computeVolatility(graph.timestamps || []);
      return [organ.toLowerCase(), {
        level: roundLevel(levels / 120),
        stability: roundLevel(1 - Math.min(1, volatility + (edgeDensity > 2 ? 0.2 : 0))),
        volatility: roundLevel(volatility)
      }];
    }));
  }

  function compressOrgan9(organ9) {
    return {
      compute: frequencyLayer([organ9.energy, organ9.rhythm, organ9.lifecycle]),
      behavior: frequencyLayer([organ9.behavior, organ9.flow, organ9.dependency]),
      resource: frequencyLayer([organ9.supply, organ9.dependency, organ9.energy]),
      ux: frequencyLayer([organ9.value, organ9.topology, organ9.behavior])
    };
  }

  function frequencyLayer(organs) {
    const value = average(organs.map(organ => organ.level));
    const volatility = average(organs.map(organ => organ.volatility));
    const stability = average(organs.map(organ => organ.stability));
    return { value: roundLevel(value), trend: roundLevel(value - volatility), volatility: roundLevel(1 - stability) };
  }

  function buildClosure(frequency4, graphs) {
    const layers = Object.fromEntries(Object.entries(frequency4).map(([name, layer], index) => [name, {
      basins: [{
        id: index + 1,
        center: layer.value,
        radius: roundLevel(0.12 + layer.volatility * 0.35),
        density: roundLevel(layer.value * (1 - layer.volatility)),
        stability: roundLevel(1 - layer.volatility)
      }],
      fixedPoints: [{ frequency: layer.value, phase: layer.trend, coherence: roundLevel(1 - layer.volatility) }],
      paths: [{ from: layer.trend, to: layer.value, curvature: roundLevel(Math.abs(layer.value - layer.trend)), damping: roundLevel(1 - layer.volatility) }],
      coherence: { matrix: coherenceMatrix(frequency4) },
      volatility: layer.volatility
    }]));
    const allEdges = ORGAN_ORDER.reduce((sum, organ) => sum + (graphs[organ]?.edges?.length || 0), 0);
    const allNodes = ORGAN_ORDER.reduce((sum, organ) => sum + (graphs[organ]?.nodes?.length || 0), 0);
    return {
      ...layers,
      topology: { basinCount: 4, connectivity: roundLevel(allEdges / Math.max(1, allNodes * 2)), depth: roundLevel(Math.min(1, allNodes / 360)) },
      fingerprint: { hash: stableHash(JSON.stringify({ frequency4, allEdges, allNodes })) }
    };
  }

  function mapClosureToHexagram(closure) {
    const values = [
      closure.compute.fixedPoints[0].coherence,
      closure.behavior.fixedPoints[0].coherence,
      closure.resource.fixedPoints[0].coherence,
      closure.ux.fixedPoints[0].coherence,
      closure.topology.connectivity,
      1 - average([closure.compute.volatility, closure.behavior.volatility, closure.resource.volatility, closure.ux.volatility])
    ];
    const median = [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    return { lines: values.map(value => value >= median ? 1 : 0) };
  }

  function generateClosureSignature(closure, hexagram, errors) {
    const transitions = inferTransitions(closure);
    const stability = average([closure.compute.fixedPoints[0].coherence, closure.behavior.fixedPoints[0].coherence, closure.resource.fixedPoints[0].coherence, closure.ux.fixedPoints[0].coherence]);
    const volatility = average([closure.compute.volatility, closure.behavior.volatility, closure.resource.volatility, closure.ux.volatility]);
    const stableValue = roundLevel(stability);
    const volatileValue = roundLevel(volatility);
    const salt = { sovereignId: "ticket-sniper-local-runtime", rhythmSeed: closure.compute.fixedPoints[0].phase, directionBias: [closure.compute.paths[0].curvature, closure.behavior.paths[0].curvature, closure.resource.paths[0].curvature, closure.ux.paths[0].curvature], lineage: "extension-local" };
    const topologyCode = `${closure.topology.basinCount}:${closure.topology.connectivity}:${closure.topology.depth}:${errors.length}`;
    const canonicalInput = { hexagram, transitions, topologyCode, stability: stableValue, volatility: volatileValue, salt };
    return {
      algorithm: "canonical-sha256",
      hexagram,
      transitions,
      topologyCode,
      stability: stableValue,
      volatility: volatileValue,
      salt,
      canonicalHash: sha256Hex(canonicalStringify(canonicalInput)),
      finalSignature: `sha256-${sha256Hex(canonicalStringify(canonicalInput))}`
    };
  }

  function verifySignature(signature, closure) {
    const expectedHexagram = mapClosureToHexagram(closure);
    const expectedTopology = `${closure.topology.basinCount}:${closure.topology.connectivity}:${closure.topology.depth}:`;
    const hexagramConsistent = signature.hexagram?.lines?.join("") === expectedHexagram.lines.join("");
    const topologyConsistent = String(signature.topologyCode || "").startsWith(expectedTopology);
    const saltConsistent = signature.salt?.sovereignId === "ticket-sniper-local-runtime";
    const canonicalInput = {
      hexagram: signature.hexagram,
      transitions: signature.transitions,
      topologyCode: signature.topologyCode,
      stability: signature.stability,
      volatility: signature.volatility,
      salt: signature.salt
    };
    const recomputedHash = sha256Hex(canonicalStringify(canonicalInput));
    const recomputed = `sha256-${recomputedHash}`;
    return {
      ok: hexagramConsistent && topologyConsistent && saltConsistent && recomputed === signature.finalSignature,
      algorithm: signature.algorithm || "legacy",
      hexagramConsistent,
      transitionConsistent: Array.isArray(signature.transitions),
      topologyConsistent,
      saltConsistent,
      finalSignatureConsistent: recomputed === signature.finalSignature,
      recomputed,
      recomputedHash
    };
  }

  function compareSignatures(current, previous) {
    const hexagramDiff = hamming(current.hexagram?.lines || [], previous.hexagram?.lines || []);
    const transitionDiff = lcsDistance(
      (current.transitions || []).map(item => item.eventType),
      (previous.transitions || []).map(item => item.eventType)
    );
    const topologyDiff = current.topologyCode === previous.topologyCode ? 0 : 1;
    const stabilityDiff = Math.abs((current.stability || 0) - (previous.stability || 0));
    const volatilityDiff = Math.abs((current.volatility || 0) - (previous.volatility || 0));
    const sovereignDiff = current.salt?.sovereignId === previous.salt?.sovereignId ? 0 : 1;
    const total = hexagramDiff + transitionDiff + topologyDiff + stabilityDiff + volatilityDiff + sovereignDiff;
    return { hexagramDiff, transitionDiff, topologyDiff, stabilityDiff: roundLevel(stabilityDiff), volatilityDiff: roundLevel(volatilityDiff), sovereignDiff, total: Math.round(total * 1000) / 1000 };
  }

  function previousSignatureFromGraphs(graphs) {
    const coarse = ORGAN_ORDER.map(organ => `${organ}:${Math.max(0, (graphs[organ]?.nodes?.length || 0) - 1)}:${Math.max(0, (graphs[organ]?.edges?.length || 0) - 1)}`).join("|");
    const lines = stableHash(coarse).slice(-6).split("").map(char => parseInt(char, 16) % 2);
    return {
      hexagram: { lines },
      transitions: [],
      topologyCode: stableHash(coarse),
      stability: 0,
      volatility: 0,
      salt: { sovereignId: "ticket-sniper-local-runtime" },
      finalSignature: `sha256-${sha256Hex(canonicalStringify({ coarse }))}`
    };
  }

  function buildSovereigntySystem(signature) {
    const block = {
      parent: "local-runtime-root",
      salt: signature.salt,
      signature: signature.finalSignature,
      timestamp: Date.now()
    };
    const chainPointer = `sha256-${sha256Hex(canonicalStringify(block))}`;
    return {
      salt: signature.salt,
      chain: {
        root: "ticket-sniper-local-runtime",
        tip: chainPointer,
        blocks: [block]
      },
      sovereignSignature: {
        hexagram: signature.hexagram,
        transitions: signature.transitions,
        topologyCode: signature.topologyCode,
        salt: signature.salt,
        chainPointer,
        algorithm: "canonical-sha256",
        finalSignature: `sha256-${sha256Hex(canonicalStringify({ signature: signature.finalSignature, chainPointer, salt: signature.salt }))}`
      },
      verification: {
        chainConsistent: true,
        saltConsistent: signature.salt?.sovereignId === "ticket-sniper-local-runtime",
        signatureLinked: Boolean(signature.finalSignature)
      }
    };
  }

  function inferTransitions(closure) {
    return Object.entries({ compute: 1, behavior: 3, resource: 5, ux: 6 }).map(([layer, changedLine]) => ({
      changedLine,
      from: closure[layer].paths[0].from,
      to: closure[layer].paths[0].to,
      eventType: closure[layer].volatility > 0.6 ? "volatility_spike" : "fixed_point_shift"
    }));
  }

  function reconstructHistory(signature, organ9) {
    return {
      stableState: signature.hexagram,
      events: signature.transitions.map(item => item.eventType),
      topologyCode: signature.topologyCode,
      organLevels: Object.fromEntries(Object.entries(organ9).map(([key, organ]) => [key, organ.level])),
      factSequenceEstimate: signature.transitions.length
    };
  }

  function predictFuture(signature, frequency4) {
    const volatility = signature.volatility;
    const next = Object.fromEntries(Object.entries(frequency4).map(([key, layer]) => [key, {
      expectedValue: roundLevel(Math.min(1, Math.max(0, layer.value + layer.trend * 0.15 - volatility * 0.05))),
      risk: volatility > 0.5 ? "unstable" : layer.value > 0.65 ? "active" : "stable"
    }]));
    return { horizon: "next-runtime-window", next, signature: signature.finalSignature };
  }

  function coherenceMatrix(frequency4) {
    const values = Object.values(frequency4).map(layer => layer.value);
    return values.map(a => values.map(b => roundLevel(1 - Math.abs(a - b))));
  }

  function computeVolatility(timestamps) {
    if (!timestamps || timestamps.length < 3) return timestamps?.length ? 0.15 : 0;
    const intervals = timestamps.slice(1).map((time, index) => Math.max(1, time - timestamps[index]));
    const avg = average(intervals);
    const variance = average(intervals.map(value => (value - avg) ** 2));
    return roundLevel(Math.min(1, Math.sqrt(variance) / Math.max(1, avg * 2)));
  }

  function hamming(left, right) {
    const length = Math.max(left.length, right.length);
    let diff = 0;
    for (let index = 0; index < length; index += 1) if (left[index] !== right[index]) diff += 1;
    return diff;
  }

  function lcsDistance(left, right) {
    const dp = Array.from({ length: left.length + 1 }, () => new Array(right.length + 1).fill(0));
    for (let i = 1; i <= left.length; i += 1) {
      for (let j = 1; j <= right.length; j += 1) {
        dp[i][j] = left[i - 1] === right[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return left.length + right.length - (2 * dp[left.length][right.length]);
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + (Number(value) || 0), 0) / values.length : 0;
  }

  function roundLevel(value) {
    return Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 1000) / 1000;
  }

  function sanitizePayload(value) {
    if (Array.isArray(value)) return value.slice(0, 30).map(sanitizePayload);
    if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 240) : value;
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, raw]) => {
      if (/token|secret|password|authorization|credential|cookie|session|email|phone|address|passport/i.test(key)) return [key, "[redacted]"];
      return [key, sanitizePayload(raw)];
    }));
  }

  function canonicalStringify(value) {
    if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
    if (!value || typeof value !== "object") return JSON.stringify(value);
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalStringify(value[key])}`).join(",")}}`;
  }

  function sha256Hex(message) {
    const bytes = utf8Bytes(String(message || ""));
    const bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    const high = Math.floor(bitLength / 0x100000000);
    const low = bitLength >>> 0;
    for (const value of [high, low]) {
      bytes.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255);
    }
    const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    const w = new Array(64);
    for (let offset = 0; offset < bytes.length; offset += 64) {
      for (let index = 0; index < 16; index += 1) {
        const at = offset + (index * 4);
        w[index] = ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
      }
      for (let index = 16; index < 64; index += 1) {
        const s0 = rotateRight(w[index - 15], 7) ^ rotateRight(w[index - 15], 18) ^ (w[index - 15] >>> 3);
        const s1 = rotateRight(w[index - 2], 17) ^ rotateRight(w[index - 2], 19) ^ (w[index - 2] >>> 10);
        w[index] = (w[index - 16] + s0 + w[index - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let index = 0; index < 64; index += 1) {
        const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (hh + s1 + ch + k[index] + w[index]) >>> 0;
        const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }
    return h.map(value => value.toString(16).padStart(8, "0")).join("");
  }

  function rotateRight(value, bits) {
    return (value >>> bits) | (value << (32 - bits));
  }

  function utf8Bytes(value) {
    if (typeof TextEncoder !== "undefined") return [...new TextEncoder().encode(value)];
    const bytes = [];
    for (let index = 0; index < value.length; index += 1) {
      let code = value.charCodeAt(index);
      if (code < 0x80) bytes.push(code);
      else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      else bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    }
    return bytes;
  }

  function stableHash(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fact-${(hash >>> 0).toString(16)}`;
  }

  const api = {
    ORGAN_DEFINITIONS,
    ORGAN_ORDER,
    FACT_TO_ORGAN,
    OrganDispatcher,
    OrganGraphBuilder,
    normalizeOrganFact,
    createRenderBlock,
    createEmptyGraphs
  };

  if (typeof globalThis !== "undefined") globalThis.TicketSniperOrganPipeline = api;
  if (typeof self !== "undefined") self.TicketSniperOrganPipeline = api;
  if (typeof window !== "undefined") window.TicketSniperOrganPipeline = api;
})();
