/**
 * KRISHVYA Crop Stage Calculation Utility
 * Computes the real-time physiological crop growth stage based on:
 * - Crop type & variety
 * - Sowing date
 * - Current calendar date
 * 
 * Supports primary Indian agronomic cycles with standard days-after-sowing (DAS).
 */

export interface CropStageResult {
  stage: string;
  subStage?: string;
  daysSinceSowing: number;
  totalDurationDays: number;
  progressPercent: number;
  description: string;
  status: 'valid' | 'no_sowing_date' | 'no_crop' | 'harvest_ready';
}

interface CropCycleDefinition {
  totalDays: number;
  stages: Array<{
    name: string;
    maxDays: number;
    description: string;
  }>;
}

const CROP_CYCLES: Record<string, CropCycleDefinition> = {
  // 1. Rice / Paddy (धान)
  rice: {
    totalDays: 130,
    stages: [
      { name: 'Nursery & Seedling', maxDays: 21, description: 'Seed germination, nursery raising and initial root establishment.' },
      { name: 'Tillering & Vegetative', maxDays: 45, description: 'Active vegetative tillering; critical window for nitrogen application.' },
      { name: 'Panicle Initiation', maxDays: 70, description: 'Stem elongation and panicle emergence inside the boot.' },
      { name: 'Flowering & Heading', maxDays: 95, description: 'Panicles emerge, flowering and pollination; sensitive to water deficit.' },
      { name: 'Milking & Dough (Grain Fill)', maxDays: 115, description: 'Grain development; starch accumulation inside hulls.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Golden grain maturity; stop irrigation 10 days before reaping.' },
    ],
  },
  paddy: {
    totalDays: 130,
    stages: [
      { name: 'Nursery & Seedling', maxDays: 21, description: 'Seed germination, nursery raising and initial root establishment.' },
      { name: 'Tillering & Vegetative', maxDays: 45, description: 'Active vegetative tillering; critical window for nitrogen application.' },
      { name: 'Panicle Initiation', maxDays: 70, description: 'Stem elongation and panicle emergence inside the boot.' },
      { name: 'Flowering & Heading', maxDays: 95, description: 'Panicles emerge, flowering and pollination; sensitive to water deficit.' },
      { name: 'Milking & Dough (Grain Fill)', maxDays: 115, description: 'Grain development; starch accumulation inside hulls.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Golden grain maturity; stop irrigation 10 days before reaping.' },
    ],
  },

  // 2. Wheat (गेहूं)
  wheat: {
    totalDays: 120,
    stages: [
      { name: 'Crown Root Initiation (CRI)', maxDays: 22, description: 'Crown roots establishing; 1st irrigation is critical.' },
      { name: 'Tillering', maxDays: 45, description: 'Shoot multiplication and canopy expansion; apply top-dress urea.' },
      { name: 'Jointing & Stem Extension', maxDays: 70, description: 'Rapid vertical growth and leaf formation.' },
      { name: 'Booting & Flowering', maxDays: 90, description: 'Earhead emergence and anthesis; watch for rust and aphid pressure.' },
      { name: 'Milking & Grain Filling', maxDays: 108, description: 'Kernels filling with milky liquid turning to dough; avoid water stress.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Golden dry spikes; moisture drops below 12%.' },
    ],
  },

  // 3. Soybean (सोयाबीन)
  soybean: {
    totalDays: 105,
    stages: [
      { name: 'Emergence & Seedling (VE-VC)', maxDays: 16, description: 'Cotyledons emerge above soil; scout for cutworms and stem fly.' },
      { name: 'Vegetative Growth (V1-V4)', maxDays: 35, description: 'Trifoliate leaf unfolding and root nodulation for nitrogen fixation.' },
      { name: 'Flowering (R1-R2)', maxDays: 55, description: 'Purple/white flowers bloom; critical window for boron and moisture.' },
      { name: 'Pod Development (R3-R4)', maxDays: 75, description: 'Rapid pod elongation; scout for semilooper and pod borer.' },
      { name: 'Seed Filling (R5-R6)', maxDays: 95, description: 'Pods swell with protein & oil rich seeds; maintain soil moisture.' },
      { name: 'Harvest Ready (R8)', maxDays: 999, description: 'Leaves drop yellow; pods rattle when shaken.' },
    ],
  },

  // 4. Cotton (कपास)
  cotton: {
    totalDays: 160,
    stages: [
      { name: 'Germination & Seedling', maxDays: 25, description: 'Emergence and taproot anchoring; protect against sucking pests.' },
      { name: 'Squaring (Bud Formation)', maxDays: 55, description: 'First floral squares appear; manage nitrogen balance.' },
      { name: 'Flowering & Boll Setting', maxDays: 90, description: 'Yellow-to-pink blossoms convert to bolls; peak moisture demand.' },
      { name: 'Boll Development & Bursting', maxDays: 135, description: 'Bolls mature and begin splitting open with white lint.' },
      { name: 'Picking / Harvest Ready', maxDays: 999, description: 'Fluffy white cotton bolls ready for picking rounds.' },
    ],
  },

  // 5. Maize / Corn (मक्का)
  maize: {
    totalDays: 100,
    stages: [
      { name: 'Seedling (V2-V4)', maxDays: 20, description: 'Initial vegetative stand establishment; scout for Fall Armyworm.' },
      { name: 'Knee-High Vegetative (V6-V8)', maxDays: 45, description: 'Rapid elongation; side-dress nitrogen fertilizer.' },
      { name: 'Tasseling & Silking (R1)', maxDays: 65, description: 'Pollen shedding and ear silking; moisture critical for grain count.' },
      { name: 'Milking & Dough (R3-R4)', maxDays: 85, description: 'Kernels fill with starch; husk leaves remain green.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Black layer forms at base of grain; ready for cob harvesting.' },
    ],
  },
  corn: {
    totalDays: 100,
    stages: [
      { name: 'Seedling (V2-V4)', maxDays: 20, description: 'Initial vegetative stand establishment; scout for Fall Armyworm.' },
      { name: 'Knee-High Vegetative (V6-V8)', maxDays: 45, description: 'Rapid elongation; side-dress nitrogen fertilizer.' },
      { name: 'Tasseling & Silking (R1)', maxDays: 65, description: 'Pollen shedding and ear silking; moisture critical for grain count.' },
      { name: 'Milking & Dough (R3-R4)', maxDays: 85, description: 'Kernels fill with starch; husk leaves remain green.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Black layer forms at base of grain; ready for cob harvesting.' },
    ],
  },

  // 6. Mustard / Rapeseed (सरसों)
  mustard: {
    totalDays: 110,
    stages: [
      { name: 'Seedling & Rosette', maxDays: 25, description: 'Leaves form flat circle near ground; thin out crowded shoots.' },
      { name: 'Branching & Stem Elongation', maxDays: 48, description: 'Lateral branch development and flower buds.' },
      { name: 'Flowering', maxDays: 72, description: 'Bright yellow canopy blooms; watch for aphid colonies.' },
      { name: 'Siliqua (Pod) Formation', maxDays: 95, description: 'Pods fill with oil seeds; avoid heavy late irrigation.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Siliquae turn straw yellow; harvest early morning to avoid shattering.' },
    ],
  },

  // 7. Chickpea / Gram (चना)
  chickpea: {
    totalDays: 110,
    stages: [
      { name: 'Seedling & Early Branching', maxDays: 25, description: 'Root nodule development for atmospheric nitrogen fixation.' },
      { name: 'Vegetative Canopy', maxDays: 50, description: 'Branching; nipping top shoots encourages bushier canopy.' },
      { name: 'Flowering & Podding', maxDays: 80, description: 'Pink/white flowers convert to pods; scout for Helicoverpa borer.' },
      { name: 'Pod Filling & Maturity', maxDays: 100, description: 'Seeds swell inside pods; foliage begins to yellow.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Pods rattle when shaken; plant stems turn pale golden.' },
    ],
  },
  gram: {
    totalDays: 110,
    stages: [
      { name: 'Seedling & Early Branching', maxDays: 25, description: 'Root nodule development for atmospheric nitrogen fixation.' },
      { name: 'Vegetative Canopy', maxDays: 50, description: 'Branching; nipping top shoots encourages bushier canopy.' },
      { name: 'Flowering & Podding', maxDays: 80, description: 'Pink/white flowers convert to pods; scout for Helicoverpa borer.' },
      { name: 'Pod Filling & Maturity', maxDays: 100, description: 'Seeds swell inside pods; foliage begins to yellow.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Pods rattle when shaken; plant stems turn pale golden.' },
    ],
  },

  // 8. Groundnut / Peanut (मूंगफली)
  groundnut: {
    totalDays: 120,
    stages: [
      { name: 'Seedling & Vegetative', maxDays: 25, description: 'Emergence and initial canopy spread.' },
      { name: 'Flowering & Pegging', maxDays: 55, description: 'Pegs enter soil to form underground pods; gypsum application needed.' },
      { name: 'Pod Development', maxDays: 90, description: 'Subterranean pods enlarge; maintain light soil friability.' },
      { name: 'Maturity & Harvest Ready', maxDays: 999, description: 'Inner pod shell shows dark veins; ready for uprooting.' },
    ],
  },

  // 9. Sugarcane (गन्ना)
  sugarcane: {
    totalDays: 360,
    stages: [
      { name: 'Germination Phase', maxDays: 45, description: 'Sprouting from setts and root band establishment.' },
      { name: 'Tillering Phase', maxDays: 120, description: 'Production of secondary tillers; earthing up and urea application.' },
      { name: 'Grand Growth Phase', maxDays: 270, description: 'Rapid internode elongation and cane biomass accumulation.' },
      { name: 'Ripening & Maturation', maxDays: 360, description: 'Sucrose accumulation in stalks; reduce irrigation gradually.' },
      { name: 'Harvest Ready', maxDays: 999, description: 'Brix reading > 18%; cane ready for sugar mill crushing.' },
    ],
  },
};

/**
 * Standard fallback for any other crop
 */
const DEFAULT_CROP_CYCLE: CropCycleDefinition = {
  totalDays: 110,
  stages: [
    { name: 'Seedling & Emergence', maxDays: 20, description: 'Early root anchoring and leaf emergence.' },
    { name: 'Vegetative Growth', maxDays: 45, description: 'Active canopy expansion and nutrient uptake.' },
    { name: 'Flowering & Heading', maxDays: 75, description: 'Reproductive bloom and pollination phase.' },
    { name: 'Fruit / Grain Filling', maxDays: 100, description: 'Yield formation and biomass trans-location.' },
    { name: 'Harvest Ready', maxDays: 999, description: 'Maturity reached; ready for harvesting.' },
  ],
};

/**
 * Parses diverse date formats:
 * - "2024-06-15" (ISO)
 * - "15 June 2024"
 * - Date object
 */
export function parseDateSafe(dateInput: string | Date | undefined | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  // Check if string is valid
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Try parsing dd Month yyyy (e.g. "15 June 2024")
  const parts = String(dateInput).trim().split(/[\s-]+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const year = parseInt(parts[2], 10);

    const monthMap: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };

    if (!isNaN(day) && monthMap[monthStr] !== undefined && !isNaN(year)) {
      const d = new Date(year, monthMap[monthStr], day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

/**
 * Calculates real-time crop stage from Crop, Variety, Sowing Date, and current date
 */
export function calculateDynamicCropStage(
  cropName: string | undefined | null,
  variety?: string | null,
  sowingDateInput?: string | Date | null
): CropStageResult {
  if (!cropName || cropName.trim() === '') {
    return {
      stage: 'Crop not selected',
      daysSinceSowing: 0,
      totalDurationDays: 100,
      progressPercent: 0,
      description: 'Please select a crop in your farm settings to view dynamic stage.',
      status: 'no_crop',
    };
  }

  const sowingDate = parseDateSafe(sowingDateInput);
  if (!sowingDate) {
    return {
      stage: 'Sowing date not set',
      daysSinceSowing: 0,
      totalDurationDays: 100,
      progressPercent: 0,
      description: 'Set your sowing date to track live growth progress and stage advice.',
      status: 'no_sowing_date',
    };
  }

  const today = new Date();
  const diffTime = today.getTime() - sowingDate.getTime();
  const daysSinceSowing = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  // Identify matching cycle definition
  const normalizedCrop = cropName.toLowerCase().trim();
  let cycle = DEFAULT_CROP_CYCLE;

  for (const [key, val] of Object.entries(CROP_CYCLES)) {
    if (normalizedCrop.includes(key) || key.includes(normalizedCrop)) {
      cycle = val;
      break;
    }
  }

  // Adjust duration if variety specifies early or late maturing
  let totalDays = cycle.totalDays;
  if (variety) {
    const vLower = variety.toLowerCase();
    if (vLower.includes('early') || vLower.includes('short')) {
      totalDays = Math.round(totalDays * 0.88);
    } else if (vLower.includes('late') || vLower.includes('long')) {
      totalDays = Math.round(totalDays * 1.15);
    }
  }

  // Find corresponding physiological stage
  let currentStageName = cycle.stages[cycle.stages.length - 1].name;
  let currentDescription = cycle.stages[cycle.stages.length - 1].description;

  for (const st of cycle.stages) {
    if (daysSinceSowing <= st.maxDays) {
      currentStageName = st.name;
      currentDescription = st.description;
      break;
    }
  }

  const progressPercent = Math.min(100, Math.round((daysSinceSowing / totalDays) * 100));
  const isHarvest = daysSinceSowing >= totalDays;

  return {
    stage: currentStageName,
    daysSinceSowing,
    totalDurationDays: totalDays,
    progressPercent,
    description: currentDescription,
    status: isHarvest ? 'harvest_ready' : 'valid',
  };
}
