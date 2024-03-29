// Immport needed to write to JSON file
var fs = require("fs");

// Array with codes of all possible diseases
const possibleDiseases = [];

// TODO
const possibleNotes = [
  {
    type: "warning, info, etc.",
    significance: "2",
    disablePossible: true,
    header:
      "This is a header informing you about a specific disease or irregularity detected in your nutrition profile information",
    text: "This is a notification text about a specific thing",
  },
];

// Object containing example data
const inputData = {
  age: { value: 34, unit: "years", name: "Alter" },
  sex: { value: "m", unit: "gender", name: "Biologisches Geschlecht" },
  weight: { value: 85, unit: "kg", name: "Gewicht" },
  height: { value: 175, unit: "cm", name: "Körpergröße" },
  // PAL will later be replaced by proper calculation function
  pal: { value: 1.4, unit: "pal", name: "PAL (Physical Activity Level)" },
  diseases: { value: ["disease1", "disease2"], name: "Krankheiten" },
  gfr: { value: 1, name: "Stadium GFR", unit: "stadium" },
  urin: "placeholder",
  blood: "placeholder",
  metVigorousActivity: {
    value: 20,
    unit: "minutes",
    name: "Vigorous Activity (pro Tag)",
  },
  metModerateActivity: {
    value: 77,
    unit: "minutes",
    name: "Moderate and Transport Activity (pro Tag)",
  },
  // TODO: Update data format of GPAQ results
  met: { value: [], name: "GPAQ results (MET scores)" },
  gpaq: { value: [{}] },
};

class NutritionProfile {
  constructor(input) {
    // Check if all initial variables contain all neccesssary fields
    // TODO: Add type checking for values
    if (
      input.age &&
      input.age.value &&
      input.age.unit == "years" &&
      input.sex &&
      input.sex.value &&
      input.weight &&
      input.weight.value &&
      input.weight.unit == "kg" &&
      input.height &&
      input.height.value &&
      input.height.unit == "cm" &&
      input.pal &&
      input.pal.value &&
      input.diseases &&
      input.diseases.value &&
      input.gfr &&
      input.gfr.value &&
      input.urin &&
      input.blood
    ) {
      // Assign variables after checking
      this.age = input.age;
      this.sex = input.sex;
      this.weight = input.weight;
      this.height = input.height;
      this.pal = input.pal;
      this.diseases = input.diseases;
      this.gfr = input.gfr;
      this.urin = input.urin;
      this.blood = input.blood;

      // Create empty nutrition profile instace
      this.nutritionProfile = {};
      // Start all calculations to fill nutrition profile
      this.addBMI();
      this.addRestEnergyDemand();

      // Additionally check for MET vigorous and normal activity (results from GPAQ, needed for better PAL value) and update pal value if applicable before calculating total energy demand
      if (
        input.metVigorousActivity &&
        input.metVigorousActivity.value &&
        input.metVigorousActivity.unit == "minutes" &&
        input.metModerateActivity &&
        input.metModerateActivity.value &&
        input.metModerateActivity.unit == "minutes"
      ) {
        // Assign variable
        this.metVigorousActivity = input.metVigorousActivity;
        this.metModerateActivity = input.metModerateActivity;
        // Update PAL value using MET (GPAQ result)
        this.updatePAL();
      }

      this.addTotalEnergyDemand();
      this.addProteinDemand();
      this.addFatsDemand();
      this.addCarbsDemand();
      this.addMinerals();
      this.addVitamins();
      this.addUricAcid();
    } else {
      console.log(
        "Data types missing, could not create nutrition profile class"
      );
      return;
    }
  }

  // Returns nutrition Profile
  getNutritionProfile() {
    return this.nutritionProfile;
  }

  // 1.) BMI
  //________________
  // Adds BMI in kg/m2 rounded to 1 decimal as number to nutrition profile
  addBMI() {
    var bmiValue = this.weight.value / Math.pow(this.height.value / 100, 2);
    // Add rounded value to nutrition profile
    this.bmi = this.nutritionProfile.bmi = {
      value: Math.round(bmiValue * 10) / 10,
      unit: "kg/m2",
      name: "BMI (Body Mass Index)",
    };
  }

  // 2.) REST ENERGY DEMAND (RUHEENERGIEBEDARF)
  //________________
  // Adds energy demand needed to power the bodies base functions in kcal to nutrition profile
  addRestEnergyDemand() {
    // Set factors for calculation based on BMI
    var weightFactor = 0;
    var heightFactor = 0;
    var sexFactor = 0;
    var ageFactor = 0;
    var addValue = 0;

    // Set initial value needed for sex
    var sexValue = 0;

    // Adapt factors based on BMI
    if (this.bmi.value <= 18.5) {
      weightFactor = 0.047;
      heightFactor = 0;
      sexFactor = 1.009;
      ageFactor = 0.01452;
      addValue = 3.21;
    } else if (this.bmi.value > 18.5 && this.bmi.value <= 25) {
      weightFactor = 0.02219;
      heightFactor = 0.02118;
      sexFactor = 0.884;
      ageFactor = 0.01191;
      addValue = 3.634;
    } else if (this.bmi.value > 25.0 && this.bmi.value < 30) {
      weightFactor = 0.04507;
      heightFactor = 0;
      sexFactor = 1.006;
      ageFactor = 0.01553;
      addValue = 3.407;
    } else if (this.bmi.value >= 30) {
      weightFactor = 0.05;
      heightFactor = 0;
      sexFactor = 1.103;
      ageFactor = 0.01586;
      addValue = 2.924;
    } else {
      console.log("BMI value out of given ranges");
      return;
    }

    // Get value used for sex (male = 1, female = 0)
    if (this.sex.value == "m") {
      sexValue = 1;
    } else if (this.sex.value == "f") {
      sexValue = 0;
    } else {
      console.log("Sex value in wrong format");
      return null;
    }

    var energyDemand =
      weightFactor * this.weight.value +
      heightFactor * this.height.value +
      sexFactor * sexValue -
      ageFactor * this.age.value +
      addValue;

    // Convert to kcal
    var energyDemandKcal = energyDemand * 238.85;

    // Assign result to nutrition profile
    this.restEnergy = this.nutritionProfile.restEnergy = {
      value: energyDemandKcal,
      name: "Ruheenergiebedarf",
      unit: "kcal",
      type: "max",
    };
  }

  // 3.) TOTAL ENERGY DEMAND (GESAMTENERGIEBEDARF)
  //________________
  // Adds total energy demand to nutrition profile multiplicating the rest energy demand with the pal value as factor
  addTotalEnergyDemand() {
    const totalEnergyDemand = this.restEnergy.value * this.pal.value;
    // Add value to nutrition profile
    this.totalEnergy = this.nutritionProfile.totalEnergy = {
      value: totalEnergyDemand,
      unit: "kcal",
      name: "Gesamtenergiebedarf",
      type: "max",
    };
  }

  // 4.) PROTEIN DEMAND (EIWEISSBEDARF)
  //________________
  // Adds protein demand to nutrition profile multiplicating the total energy demand with a factor that depends on the current gfr stadium
  addProteinDemand() {
    var proteinFactor = 0;
    // Get factor based on gfr value/stadium
    if (this.gfr.value == 1 || this.gfr.value == 2) {
      proteinFactor = 0.8;
    } else if (this.gfr.value == 3) {
      proteinFactor = 0.7;
    } else if (this.gfr.value == 4) {
      proteinFactor = 0.8;
    } else if (this.gfr.value == 5) {
      proteinFactor = 1;
    } else {
      console.log("Wrong gfr value sent to getProteinDemand function");
      return;
    }
    // Add value to nutrition profile
    this.protein = this.nutritionProfile.protein = {
      value: this.weight.value * proteinFactor,
      unit: "g",
      name: "Eiweißbedarf",
      type: "max",
    };
  }

  // 5.) FATS DEMAND (FETTBEDARF)
  //________________
  // Returns different fats demand (general, satured, single unsaturated, multiple unsaturated) based on percentage of total energy demand
  addFatsDemand() {
    // Set divisor to get from kcal to gramms
    const fatsKcalToGrammDivisor = 9.3;

    // Add general fats (30% of total energy demand)
    this.fats = this.nutritionProfile.fats = {
      value: (this.totalEnergy.value * 0.3) / fatsKcalToGrammDivisor,
      unit: "g",
      name: "Fettbedarf",
      type: "max",
    };

    // Add saturated fatty acids (maximum 10% of total energy demand)
    this.saturatedFats = this.nutritionProfile.saturatedFats = {
      value: (this.totalEnergy.value * 0.1) / fatsKcalToGrammDivisor,
      unit: "g",
      name: "Gesättigte Fettsäuren (GFS)",
      type: "max",
    };

    // Add single unsaturated fatty acids (maximum 10% - 13% of total energy demand)
    this.singleUnsaturatedFats = this.nutritionProfile.singleUnsaturatedFats = {
      value: (this.totalEnergy.value * 0.1) / fatsKcalToGrammDivisor,
      unit: "g",
      name: "Einfach ungesättigte Fettsäuren (EUFS)",
      type: "maxRange",
      minValue: (this.totalEnergy.value * 0.1) / fatsKcalToGrammDivisor,
      maxValue: (this.totalEnergy.value * 0.13) / fatsKcalToGrammDivisor,
    };

    // Add multiple unsaturated fatty acids (maximum 7% - 10% of total energy demand)
    this.multipleUnsaturatedFats = this.nutritionProfile.multipleUnsaturatedFats = {
      value: (this.totalEnergy.value * 0.07) / fatsKcalToGrammDivisor,
      unit: "g",
      name: "Mehrfach ungesättigte Fettsäuren (MUFS)",
      type: "maxRange",
      minValue: (this.totalEnergy.value * 0.07) / fatsKcalToGrammDivisor,
      maxValue: (this.totalEnergy.value * 0.1) / fatsKcalToGrammDivisor,
    };

    // Add trans fatty acids (maximum 10% of total energy demand)
    this.transFats = this.nutritionProfile.transFats = {
      value: (this.totalEnergy.value * 0.01) / fatsKcalToGrammDivisor,
      unit: "g",
      name: "Transfettsäuren",
      type: "max",
    };
  }

  // TODO
  // 6.) CARBS DEMAND (KOHLENHYDRATBEDARF)
  //________________
  // Add carbs demand to nutrition profile
  addCarbsDemand() {
    // Get protein value in kcal
    const proteinKcal = this.protein.value * 4.1;
    // Get fats value in kcal
    const fatsKcal = this.fats.value * 9.3;
    // Calculate carbs by substracting protein and fats value from total energy demand
    const carbsKcal = this.totalEnergy.value - proteinKcal - fatsKcal;
    // Get carbs value in grams
    const carbsGramm = carbsKcal / 4.1;
    // Add carbs value to nutrition profile
    this.carbs = this.nutritionProfile.carbs = {
      value: carbsGramm,
      unit: "g",
      name: "Kohlenhydratbedarf",
      type: "max",
    };
  }

  // 7.) MINERALS (MINERALSTOFFE)
  //________________
  // Adds minerals demand to nutrition profile
  addMinerals() {
    // Minerals table
    var minerals = {
      vitaminA: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      thiamin: {
        unit: "mg",
        name: "Thiamin",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      riboflavin: {
        unit: "mg",
        name: "Riboflavin",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      niacin: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      vitaminB6: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      folat: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      vitaminC: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      calcium: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      phosphor: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      magnesium: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      eisen: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      iod: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      zink: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      vitaminD: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      vitaminE: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      vitaminK: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
      panthotensäure: {
        unit: "mg",
        name: "Vitamin A",
        type: "averageWeek",
        value: [1, 0.8, 1, 0.8, 1, 0.8],
      },
    };

    // Get index based on age and gender (value between 0 and 5)
    var index = 0;
    if (this.age.value >= 51 && this.age.value < 65) {
      index = 2;
    } else if (this.age.value >= 65) {
      index = 4;
    }
    // Increase index if female
    if (this.sex.value == "f") {
      index += 1;
    }

    // Iterate through minerals table selecting the value based on index
    for (var mineral in minerals) {
      // Get mineral object
      var mineralToAdd = minerals[mineral];
      // Select values depending on index
      if (mineralToAdd.value) {
        mineralToAdd.value = mineralToAdd.value[index];
      }
      if (mineralToAdd.minValue) {
        mineralToAdd.minValue = mineralToAdd.minValue[index];
      }
      if (mineralToAdd.maxValue) {
        mineralToAdd.maxValue = mineralToAdd.maxValue[index];
      }
      // Store and add updated mineral object to nutrition profile
      this[mineral] = this.nutritionProfile[mineral] = mineralToAdd;
    }

    // Special cases with diseases
    // Add calcium (check for ostheoporose and renale osteopathie)
    var calciumMg = 1000;
    if (
      this.diseases.value.includes["osteoporose"] ||
      this.diseases.value.includes["renalOstheopathie"]
    ) {
      calciumMg = 2000;
    }
    this.calcium = this.nutritionProfile.calcium = {
      value: calciumMg,
      unit: "mg",
      name: "Calcium",
      type: "averageWeek",
    };

    // Add chlorid
    this.chlorid = this.nutritionProfile.chlorid = {
      value: 2300,
      unit: "mg",
      name: "Chlorid",
      type: "averageWeek",
    };

    // Add potassium (check for hyperkaliämie)
    if (this.diseases.value.includes["hyperkaliämie "]) {
      this.potassium = this.nutritionProfile.potassium = {
        value: 2000,
        unit: "mg",
        name: "Kalium",
        type: "maxRange",
        minValue: 2000,
        maxValue: 2700,
      };
    } else {
      this.potassium = this.nutritionProfile.potassium = {
        value: 4000,
        unit: "mg",
        name: "Kalium",
        type: "max",
      };
    }

    // Add magnesium (check for sex)
    var magnesiumMg = undefined;
    if (this.sex.value == "m") {
      magnesiumMg = 350;
    } else if (this.sex.value == "f") {
      magnesiumMg = 300;
    }
    this.magnesium = this.nutritionProfile.magnesium = {
      value: magnesiumMg,
      unit: "mg",
      name: "Magnesium",
      type: "max",
    };

    // Add phosphate
    this.phosphate = this.nutritionProfile.phosphate = {
      value: 700,
      unit: "mg",
      name: "Phosphat",
      type: "max",
    };

    // Add sodium
    this.sodium = this.nutritionProfile.sodium = {
      value: 1500,
      unit: "mg",
      name: "Natrium",
      type: "max",
    };
  }

  // 8.) VITAMINS (VITAMINE)
  //________________
  // Adds vitamin demand to nutrition profile
  addVitamins() {
    // Add vitamin D
    this.vitaminD = this.nutritionProfile.vitaminD = {
      value: 20,
      unit: "µg",
      name: "Vitamin D (Calciferol)",
      type: "max",
    };
  }

  // 9.) URIC ACID (HARNSÄURE)
  //________________
  // Adds uric acid demand to nutrition profile
  addUricAcid() {
    // TODO: Check for uric acid concentration in blood values
    if (this.diseases.value.includes("hyperurikämie") || this.blood)
      this.uricAcid = this.nutritionProfile.uricAcid = {
        value: 500,
        unit: "mg",
        name: "Harnsäure",
        type: "max",
      };
  }

  // HELPER: MET TO PAL CALCULATOR
  //________________
  // Updates pal value based on results of GPAQ questionnaire (MET minutes), calculation based on the following paper: An Easy Approach to Calculating Estimated Energy Requirements (Gerrior et al.)
  updatePAL() {
    // Set factors needed for calculation
    const factorModerateActivity = 4;
    const factorVigorousActivity = 8;
    const basePAL = 1.1;

    // Calculate deltas
    const deltaPalModerateActivity = this.metToPal(
      factorModerateActivity,
      this.metModerateActivity.value
    );
    const deltaPalVigorousActivity = this.metToPal(
      factorVigorousActivity,
      this.metVigorousActivity.value
    );

    // Calculate PAL by adding up the deltas
    const pal = basePAL + deltaPalVigorousActivity + deltaPalModerateActivity;
    console.log("Updated PAL value using GPAQ results, new PAL is: " + pal);
  }

  // Converts single met activity values into PAL value using the met factor (4 or 8) and the duration of the activity
  metToPal(metValue, durationMinutes) {
    const deltaPal =
      ((metValue - 1) * ((1.15 / 0.9) * (durationMinutes / 1440))) /
      (this.restEnergy.value / (0.0175 * 1440 * this.weight.value));
    return deltaPal;
  }
}

var nutritionProfile = new NutritionProfile(inputData);

// Generate JSON string and write to JSON file
var nutritionProfileJSON = JSON.stringify(nutritionProfile);
fs.writeFile("nutrition_profile.json", nutritionProfileJSON, "utf8", () => {
  console.log("JSON written to file");
});

console.log(nutritionProfile.getNutritionProfile());
