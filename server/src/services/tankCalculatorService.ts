export interface Agrochemical {
  id: string;
  name: string;
  category: 'Fungicide' | 'Insecticide' | 'Bio-Pesticide' | 'Soluble Fertilizer' | 'Micronutrient';
  formulation: string; // e.g., "75% WP", "18.5% SC"
  standardDosePerLiter: number; // in ml or grams
  unit: 'ml' | 'g';
  activeTarget: string;
  isOrganic: boolean;
  notes: string;
}

export const AGROCHEMICALS: Agrochemical[] = [
  {
    id: 'mancozeb',
    name: 'Mancozeb (Dithane M-45)',
    category: 'Fungicide',
    formulation: '75% WP (Wettable Powder)',
    standardDosePerLiter: 2.5,
    unit: 'g',
    activeTarget: 'Leaf Blight, Downy Mildew, Rust, Anthracnose',
    isOrganic: false,
    notes: 'Contact fungicide with broad spectrum multi-site action.',
  },
  {
    id: 'copper_oxychloride',
    name: 'Copper Oxychloride (Blitox 50)',
    category: 'Fungicide',
    formulation: '50% WP',
    standardDosePerLiter: 2.5,
    unit: 'g',
    activeTarget: 'Bacterial Blight, Canker, Leaf Spot, Fruit Rot',
    isOrganic: false,
    notes: 'Strong alkaline contact fungicide. Highly reactive.',
  },
  {
    id: 'carbendazim',
    name: 'Carbendazim (Bavistin)',
    category: 'Fungicide',
    formulation: '50% WP',
    standardDosePerLiter: 1.5,
    unit: 'g',
    activeTarget: 'Powdery Mildew, Collar Rot, Wilt, Tikka disease',
    isOrganic: false,
    notes: 'Systemic fungicide. Often mixed safely with Mancozeb (Saaf).',
  },
  {
    id: 'chlorantraniliprole',
    name: 'Chlorantraniliprole (Coragen)',
    category: 'Insecticide',
    formulation: '18.5% SC (Suspension Concentrate)',
    standardDosePerLiter: 0.3,
    unit: 'ml',
    activeTarget: 'Pod Borer, Fall Armyworm, Stem Borer, Bollworm',
    isOrganic: false,
    notes: 'Extremely concentrated modern insecticide. Very small dose required.',
  },
  {
    id: 'imidacloprid',
    name: 'Imidacloprid (Confidor)',
    category: 'Insecticide',
    formulation: '17.8% SL (Soluble Liquid)',
    standardDosePerLiter: 0.5,
    unit: 'ml',
    activeTarget: 'Aphids, Whiteflies, Jassids, Thrips',
    isOrganic: false,
    notes: 'Systemic neonicotinoid targeting sucking pests.',
  },
  {
    id: 'chlorpyrifos',
    name: 'Chlorpyrifos (Dursban)',
    category: 'Insecticide',
    formulation: '20% EC (Emulsifiable Concentrate)',
    standardDosePerLiter: 2.0,
    unit: 'ml',
    activeTarget: 'Termites, Cutworms, Caterpillars, Root Grub',
    isOrganic: false,
    notes: 'Organophosphate compound. Toxic to bees and incompatible with copper.',
  },
  {
    id: 'neem_oil',
    name: 'Pure Neem Oil (Azadirachtin 10,000 ppm)',
    category: 'Bio-Pesticide',
    formulation: 'EC (Bio-Botanical)',
    standardDosePerLiter: 3.0,
    unit: 'ml',
    activeTarget: 'Repelling whiteflies, leafhoppers, egg laying disruption',
    isOrganic: true,
    notes: 'Zero chemical residue. Safe for beneficial bees, ladybirds, and spiders.',
  },
  {
    id: 'trichoderma',
    name: 'Trichoderma viride',
    category: 'Bio-Pesticide',
    formulation: 'Bio-fungicide Powder',
    standardDosePerLiter: 5.0,
    unit: 'g',
    activeTarget: 'Root rot, Wilt, Damping off, Collar rot',
    isOrganic: true,
    notes: 'Beneficial living fungus. Never mix with chemical fungicides.',
  },
  {
    id: 'npk_19_19_19',
    name: 'Water Soluble NPK (19:19:19)',
    category: 'Soluble Fertilizer',
    formulation: '100% Water Soluble Granules',
    standardDosePerLiter: 5.0,
    unit: 'g',
    activeTarget: 'Balanced vegetative growth and plant greening',
    isOrganic: false,
    notes: 'Foliar fertilizer. Dissolve thoroughly in water first.',
  },
  {
    id: 'boron_20',
    name: 'Soluble Boron (Disodium Octaborate)',
    category: 'Micronutrient',
    formulation: '20% Powder',
    standardDosePerLiter: 1.0,
    unit: 'g',
    activeTarget: 'Flower retention, pollen viability, preventing flower drop',
    isOrganic: false,
    notes: 'Crucial for flowering stage in Soybean and Cotton.',
  },
  {
    id: 'calcium_nitrate',
    name: 'Calcium Nitrate',
    category: 'Soluble Fertilizer',
    formulation: 'Granular Water Soluble',
    standardDosePerLiter: 4.0,
    unit: 'g',
    activeTarget: 'Cell wall strength, fruit firmness, preventing blossom end rot',
    isOrganic: false,
    notes: 'Never mix with phosphates or sulphates to prevent precipitation.',
  },
];

export interface CompatibilityReport {
  status: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  title: string;
  explanation: string;
  farmerWarningHindi: string;
  mixingInstruction: string;
}

export function evaluateChemicalCompatibility(
  chemAId: string,
  chemBId?: string
): CompatibilityReport {
  if (!chemBId || chemAId === chemBId) {
    return {
      status: 'SAFE',
      title: 'Single Formulation (Safe)',
      explanation: 'Using a single agrochemical eliminates chemical antagonism and avoids nozzle clogging.',
      farmerWarningHindi: 'एकल दवा का छिड़काव सुरक्षित है। सही माप के साथ घोल बनाएं।',
      mixingInstruction: 'Dissolve in a small bucket of clean water before pouring into the spray tank.',
    };
  }

  const a = AGROCHEMICALS.find((c) => c.id === chemAId);
  const b = AGROCHEMICALS.find((c) => c.id === chemBId);

  if (!a || !b) {
    return {
      status: 'SAFE',
      title: 'Combination Not Flagged',
      explanation: 'Always perform a simple 5-minute Jar Test in a small glass before filling the 15L tank.',
      farmerWarningHindi: 'छिड़काव से पहले एक छोटे बर्तन में मिलाकर देख लें कि दूध जैसा फट तो नहीं रहा।',
      mixingInstruction: 'Dissolve powders first, followed by liquids and soluble nutrients.',
    };
  }

  // DANGER 1: Copper Oxychloride + Organophosphates (Chlorpyrifos)
  if (
    (a.id === 'copper_oxychloride' && b.id === 'chlorpyrifos') ||
    (b.id === 'copper_oxychloride' && a.id === 'chlorpyrifos')
  ) {
    return {
      status: 'DANGEROUS',
      title: 'DANGEROUS COCKTAIL: Copper + Organophosphate',
      explanation:
        'DO NOT MIX! Copper Oxychloride is strongly alkaline. It rapidly hydrolyzes Chlorpyrifos, neutralizing its pest-killing power and creating a toxic curdled precipitate that burns plant foliage and clogs spray nozzles.',
      farmerWarningHindi:
        '⚠️ सख्त मना है! कॉपर ऑक्सीक्लोराइड और क्लोरपायरीफॉस को कभी न मिलाएं! यह घोल दूध की तरह फट जाएगा, पत्तियों को जला देगा और नोजल जाम कर देगा।',
      mixingInstruction: 'Apply Chlorpyrifos and Copper Oxychloride in separate sprays spaced at least 4 days apart.',
    };
  }

  // DANGER 2: Living Bio-Agents (Trichoderma) + Chemical Fungicide (Mancozeb / Carbendazim / Copper)
  if (
    (a.id === 'trichoderma' && (b.category === 'Fungicide' && !b.isOrganic)) ||
    (b.id === 'trichoderma' && (a.category === 'Fungicide' && !a.isOrganic))
  ) {
    return {
      status: 'DANGEROUS',
      title: 'INCOMPATIBLE: Bio-agent + Chemical Fungicide',
      explanation:
        'DO NOT MIX! Trichoderma is a living beneficial fungus. The chemical fungicide will kill 100% of the Trichoderma spores in the tank, rendering your bio-agent completely useless and wasting money.',
      farmerWarningHindi:
        '⚠️ ट्राइकोडर्मा को किसी भी रासायनिक फफूंदनाशक के साथ न मिलाएं! रासायनिक दवा जीवित ट्राइकोडर्मा को तुरंत मार देगी।',
      mixingInstruction: 'Apply Trichoderma either as soil treatment or space 7 days apart from chemical fungicides.',
    };
  }

  // DANGER 3: Calcium Nitrate + Phosphate/Sulphate Fertilizers
  if (
    (a.id === 'calcium_nitrate' && (b.id === 'npk_19_19_19' || b.id === 'boron_20')) ||
    (b.id === 'calcium_nitrate' && (a.id === 'npk_19_19_19' || a.id === 'boron_20'))
  ) {
    return {
      status: 'CAUTION',
      title: 'Precipitation Risk: Calcium + Phosphates',
      explanation:
        'CAUTION! Calcium reacts with phosphates/sulphates to form insoluble white gypsum chalk flakes that deposit at the bottom of the tank and clog your knapsack pump filter.',
      farmerWarningHindi:
        'सावधानी: कैल्शियम और फास्फेट को एक साथ मिलाने से नीचे सफेद चूना जम सकता है। अलग-अलग घोलें।',
      mixingInstruction: 'Always dissolve Calcium Nitrate in tank water first before adding any other micro-nutrient.',
    };
  }

  // SAFE 1: Mancozeb + Carbendazim (Classic Saaf combination)
  if (
    (a.id === 'mancozeb' && b.id === 'carbendazim') ||
    (b.id === 'mancozeb' && a.id === 'carbendazim')
  ) {
    return {
      status: 'SAFE',
      title: 'SAFE COMBINATION: Dual-Action Fungicide (Contact + Systemic)',
      explanation:
        'Highly effective combination (popularly known as Saaf formulation). Mancozeb protects leaf surfaces from outside, while Carbendazim enters the plant sap to eradicate deep fungal infections.',
      farmerWarningHindi:
        '✅ बहुत सुरक्षित और असरदार! मैंकोजेब और कार्बेन्डाजिम का मिश्रण पत्तों को बाहर और अंदर दोनों तरफ से सुरक्षित करता है।',
      mixingInstruction: 'Mix both powders into a smooth slurry in a bucket with 1L water, then pour into the 15L spray tank.',
    };
  }

  // SAFE 2: Soluble NPK 19:19:19 + Imidacloprid (Nutrient + Sucking pest control)
  if (
    (a.id === 'npk_19_19_19' && b.id === 'imidacloprid') ||
    (b.id === 'npk_19_19_19' && a.id === 'imidacloprid')
  ) {
    return {
      status: 'SAFE',
      title: 'SAFE COMBINATION: Foliar Nutrition + Sucking Pest Control',
      explanation:
        'Compatible tank mix. Provides quick greening through 19:19:19 while simultaneously eliminating whiteflies and aphids through systemic Imidacloprid.',
      farmerWarningHindi:
        '✅ सुरक्षित मिश्रण! 19:19:19 खाद और कॉनफिडोर को एक साथ मिलाकर छिड़काव किया जा सकता है।',
      mixingInstruction: 'Dissolve the 19:19:19 granules completely first, then add Imidacloprid liquid, and stir gently.',
    };
  }

  // Default Caution
  return {
    status: 'CAUTION',
    title: 'Acceptable Combination (Perform Jar Test First)',
    explanation:
      'These two formulations can generally be tank-mixed. However, water hardness or temperature variations in your village can alter dissolution. Always perform a 2-minute test in a small cup before full tank preparation.',
    farmerWarningHindi:
      'सावधानी: दोनों को मिला सकते हैं, लेकिन पहले 1 गिलास पानी में दोनों की 1-1 बूंद डालकर देख लें।',
    mixingInstruction: '1. Fill tank 50% with clean water. 2. Add powder slurry. 3. Add liquid concentrate. 4. Top up with water to 15 Liters.',
  };
}

export interface TankCalculationResult {
  tankSizeLiters: number;
  selectedChemical: Agrochemical;
  secondaryChemical?: Agrochemical;
  compatibility: CompatibilityReport;
  dosePerTankFormatted: string;
  bottleCapsPerTank: number; // 1 standard agro-chemical bottle cap = 10 ml / 10 g
  spoonsPerTank: number; // 1 tablespoon = 15 g
  waterRequiredPerAcreLiters: number;
  totalTanksForAcre: number;
  totalTanksForFarm: number;
  totalChemicalNeeded: string;
  zeroCostOrganicAlternative: {
    name: string;
    recipe: string;
    costEstimate: string;
  };
  stepByStepMixingOrder: string[];
}

export function calculateSprayTankDose(
  chemicalId: string,
  secondaryChemicalId: string = '',
  tankCapacityLiters: number = 15,
  farmAcres: number = 2.5
): TankCalculationResult {
  const chem = AGROCHEMICALS.find((c) => c.id === chemicalId) || AGROCHEMICALS[0];
  const secondaryChem = AGROCHEMICALS.find((c) => c.id === secondaryChemicalId);

  const dosePerTankExact = chem.standardDosePerLiter * tankCapacityLiters;
  const dosePerTankFormatted = `${dosePerTankExact} ${chem.unit}`;

  // Bottle cap measurement: 1 standard bottle cap = 10 ml
  const bottleCapsPerTank = Math.round((dosePerTankExact / 10) * 10) / 10;
  const spoonsPerTank = Math.round((dosePerTankExact / 15) * 10) / 10;

  // Standard Indian knapsack requirement: 120–150 Liters of water per acre for dense canopy (Soybean/Cotton)
  const waterRequiredPerAcreLiters = 135;
  const totalTanksForAcre = Math.ceil(waterRequiredPerAcreLiters / tankCapacityLiters);
  const totalTanksForFarm = Math.ceil(totalTanksForAcre * farmAcres);

  const totalChemicalForFarm = dosePerTankExact * totalTanksForFarm;
  const totalChemicalNeeded =
    chem.unit === 'g'
      ? totalChemicalForFarm >= 1000
        ? `${(totalChemicalForFarm / 1000).toFixed(2)} kg`
        : `${Math.round(totalChemicalForFarm)} grams`
      : totalChemicalForFarm >= 1000
      ? `${(totalChemicalForFarm / 1000).toFixed(2)} Liters`
      : `${Math.round(totalChemicalForFarm)} ml`;

  const compatibility = evaluateChemicalCompatibility(chem.id, secondaryChem?.id);

  return {
    tankSizeLiters: tankCapacityLiters,
    selectedChemical: chem,
    secondaryChemical: secondaryChem,
    compatibility,
    dosePerTankFormatted,
    bottleCapsPerTank,
    spoonsPerTank,
    waterRequiredPerAcreLiters,
    totalTanksForAcre,
    totalTanksForFarm,
    totalChemicalNeeded,
    zeroCostOrganicAlternative: {
      name: '5% Neem Seed Kernel Extract (NSKE / नींबोली अर्क)',
      recipe:
        'Pound 500g dried neem seeds, soak in 10L water overnight, filter through khadi cloth, add 20g soap solution as sticker. Pour into your 15L knapsack pump.',
      costEstimate: '₹0 (Free homemade from village neem trees)',
    },
    stepByStepMixingOrder: [
      `1. Fill your ${tankCapacityLiters}L spray pump half full (approx. ${Math.round(tankCapacityLiters / 2)} Liters) with clean, mud-free water.`,
      `2. Take a small plastic bucket with 1 Liter water and dissolve exact ${dosePerTankFormatted} (${chem.unit === 'ml' ? `${bottleCapsPerTank} bottle caps` : `${spoonsPerTank} spoons`}) to make a smooth pre-mix.`,
      ...(secondaryChem
        ? [
            `3. Add secondary formulation (${secondaryChem.name} @ ${secondaryChem.standardDosePerLiter * tankCapacityLiters} ${secondaryChem.unit}) into the bucket and stir gently for 30 seconds.`,
          ]
        : []),
      `4. Pour the bucket mixture into the spray pump tank through the nylon mesh filter to block any grit.`,
      `5. Add remaining water to reach the ${tankCapacityLiters}L mark and close the lid tightly.`,
      `6. Shake the pump twice before strapping onto your back. Spray during calm evening hours (after 4:00 PM).`,
    ],
  };
}
