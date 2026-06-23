export type FunctionType = "step" | "linear" | "inverse" | "logistic" | "logarithmic";

export type ForceConfig = {
  enabled: boolean;
  strength: number;
  functionType: FunctionType;
};

export type PhysicsConfig = {
  simulationSpeed: number;
  damping: number;
  paused: boolean;
  centerPull: ForceConfig;
  basicRepulsion: ForceConfig;
  springAttraction: ForceConfig;
  graphDistanceRepulsion: ForceConfig;
  degreeDrift: ForceConfig;
  degreeRepulsion: ForceConfig;
  eigenvectorDrift: ForceConfig;
};

export const defaultPhysicsConfig: PhysicsConfig = {
  simulationSpeed: 0.02,
  damping: 0.92,
  paused: false,
  centerPull:             { enabled: true,  strength: 1.0, functionType: "linear"  },
  basicRepulsion:         { enabled: true,  strength: 1.0, functionType: "step"    },
  springAttraction:       { enabled: true,  strength: 1.0, functionType: "linear"  },
  graphDistanceRepulsion: { enabled: false, strength: 1.0, functionType: "linear"  },
  degreeDrift:            { enabled: false, strength: 1.0, functionType: "linear"  },
  degreeRepulsion:        { enabled: false, strength: 1.0, functionType: "linear"  },
  eigenvectorDrift:       { enabled: false, strength: 1.0, functionType: "linear"  },
};
