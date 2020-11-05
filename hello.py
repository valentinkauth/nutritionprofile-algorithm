
class Value:
    def __init__(self, id, value, unit):
        self.id = id
        self.value = value
        self.unit = unit


# Predefined example values for input (e.g. captured in onboarding)
# values: age, sex, size, weight, diseases, pal

input = {"age": {"unit": "years", "value": 27, "name": "Alter"},
         "weight": {"unit": "kg", "value": 83.7, "name": "Gewicht"},
         "height": {"unit": "cm", "value": 184, "name": "Größe"},
         "sex": {"unit": "years", "value": "m", "name": "Geschlecht"},
         "pal": {"value": 27, "name": "PAL (Physical Activity-Level)"},
         "diseases": {"value": ["disease1", "disease2", "disease3"], "name": "Krankheiten/Vorerkrankungen"}, }


# Create empty instance of nutrition profile
nutrition_profile = {}


# Returns BMI (body mass index) based on weight and size
def get_bmi(input):

    # Safe way
    # return input.get("age", {}).get("value", {})

    # Dirty way without checking if keys exists
    # return input["age"]["value"]

    try:
        weight = input['weight']['value']
        height = input["height"]['value']

        bmi = weight / ((height/100) ** 2)
        bmi_rounded = round(bmi, 1)

        nutrition_profile["bmi"] = {
            "value": bmi_rounded, "unit": "kg/m2", "name": "BMI (Body Mass Index)"}
    except KeyError:
        print("There was an error with the inputs")
        pass


def get_enery(input):

    try:
        bmi = get_bmi(input)
        sex = input["sex"]["value"]
    except KeyError:
        print("There was an error with the inputs")
        pass


# Defines the amount of calcium based on diseases
def add_calcium(diseases):
    value = 1000
    if ("osteoporose" in diseases or "osteopathie" in diseases):
        value = 2000

    return {"value": value, "unit": "mg", "name": "Calcium"}


# Create dictionary containing nutrition profile
def create_nutrition_profile(input):
    nutrition_profile = {}
    # TODO: Check if all needed input values are available (also lab results)
    # TODO: Check if all needed input values are in the correct unit (and format)
    # TODO: Add every single value to nutrition profile using the created functions
    nutrition_profile["calcium"] = add_calcium()

    return nutrition_profile


nutrition_profile_test = create_nutrition_profile(input)
print(nutrition_profile)
