import type { Cocktail } from "@/api/cocktail";

// Sample popular cocktail data
const popularCocktails: Record<string, Cocktail> = {
  mojito: {
    name: "莫吉托",
    english_name: "Mojito",
    description:
      "莫吉托是一款清爽的朗姆酒鸡尾酒，源自古巴，以薄荷、青柠和苏打水的清新口感著称。",
    english_description: "A refreshing rum cocktail originating from Cuba, known for its fresh mint, lime, and soda water flavors.",
    match_reason:
      "这款低酒精度的清爽鸡尾酒非常受欢迎。莫吉托制作简单，不需要专业工具，且口感清新，带有薄荷和青柠的香气。",
    english_match_reason: "This low-alcohol refreshing cocktail is very popular. The Mojito is simple to make, requires no professional tools, and has a fresh taste with mint and lime aromas.",
    base_spirit: "朗姆酒",
    english_base_spirit: "Rum",
    alcohol_level: "低",
    english_alcohol_level: "Low",
    serving_glass: "高球杯",
    english_serving_glass: "Highball Glass",
    time_required: "5分钟",
    english_time_required: "5 minutes",
    flavor_profiles: ["清新", "酸甜", "薄荷香"],
    english_flavor_profiles: ["Refreshing", "Sweet & Sour", "Minty"],
    ingredients: [
      { name: "白朗姆酒", amount: "60", unit: "ml", english_name: "White Rum" },
      { name: "新鲜青柠汁", amount: "30", unit: "ml", english_name: "Fresh Lime Juice" },
      { name: "糖浆", amount: "15", unit: "ml", substitute: "白砂糖", english_name: "Simple Syrup", english_substitute: "White Sugar" },
      { name: "薄荷叶", amount: "8-10", unit: "片", english_name: "Mint Leaves", english_unit: "leaves" },
      { name: "苏打水", amount: "适量", english_name: "Soda Water", english_amount: "to top" },
      { name: "冰块", amount: "适量", english_name: "Ice Cubes", english_amount: "to fill" },
    ],
    tools: [
      { name: "高球杯", alternative: "任何玻璃杯", english_name: "Highball Glass", english_alternative: "Any glass" },
      { name: "调酒勺", alternative: "长柄勺", english_name: "Bar Spoon", english_alternative: "Long spoon" },
      { name: "捣棒", alternative: "木勺", english_name: "Muddler", english_alternative: "Wooden spoon" },
    ],
    steps: [
      {
        step_number: 1,
        description: "将薄荷叶和糖浆放入杯中，轻轻捣碎薄荷叶以释放香气。",
        english_description: "Place mint leaves and simple syrup in the glass, gently muddle the mint leaves to release their aroma.",
        tips: "注意不要过度捣碎薄荷叶，以免苦味释放。",
        english_tips: "Be careful not to over-muddle the mint leaves to avoid releasing bitterness.",
      },
      {
        step_number: 2,
        description: "加入新鲜青柠汁和白朗姆酒。",
        english_description: "Add fresh lime juice and white rum.",
        tips: "先加入青柠汁可以更好地溶解糖分。",
        english_tips: "Adding lime juice first helps dissolve the sugar better.",
      },
      {
        step_number: 3,
        description: "加入冰块，用调酒勺轻轻搅拌。",
        english_description: "Add ice cubes and stir gently with a bar spoon.",
        tips: "使用碎冰可以让饮品更快冷却。",
        english_tips: "Using crushed ice helps the drink cool down faster.",
      },
      {
        step_number: 4,
        description: "最后加入苏打水至杯口，轻轻搅拌。",
        english_description: "Finally, top with soda water and stir gently.",
        tips: "缓慢倒入苏打水以保留气泡。",
        english_tips: "Pour the soda water slowly to preserve the bubbles.",
      },
      {
        step_number: 5,
        description: "用薄荷叶和青柠片装饰，即可享用。",
        english_description: "Garnish with mint leaves and lime slices, then serve.",
        tips: "饮用前轻轻搅拌，让风味更均匀。",
        english_tips: "Give it a gentle stir before drinking to ensure even flavor distribution.",
      },
    ],
  },
  margarita: {
    name: "玛格丽特",
    english_name: "Margarita",
    description:
      "玛格丽特是一款经典的龙舌兰鸡尾酒，以其完美平衡的酸甜口感和盐边杯口而闻名。",
    english_description: "A classic tequila cocktail known for its perfectly balanced sweet and sour taste and salted rim.",
    match_reason:
      "这款经典鸡尾酒平衡了龙舌兰的烈性与青柠的酸甜，是世界上最受欢迎的鸡尾酒之一。",
    english_match_reason: "This classic cocktail balances the strength of tequila with the sweet and sour taste of lime, making it one of the world's most popular cocktails.",
    base_spirit: "龙舌兰",
    english_base_spirit: "Tequila",
    alcohol_level: "中",
    english_alcohol_level: "Medium",
    serving_glass: "玛格丽特杯",
    english_serving_glass: "Margarita Glass",
    time_required: "5分钟",
    english_time_required: "5 minutes",
    flavor_profiles: ["酸甜", "清爽", "柑橘香"],
    english_flavor_profiles: ["Sweet & Sour", "Refreshing", "Citrus"],
    ingredients: [
      { name: "龙舌兰酒", amount: "50", unit: "ml", english_name: "Tequila" },
      { name: "君度橙酒", amount: "20", unit: "ml", english_name: "Cointreau" },
      { name: "新鲜青柠汁", amount: "25", unit: "ml", english_name: "Fresh Lime Juice" },
      { name: "细盐", amount: "适量", substitute: "粗海盐", english_name: "Fine Salt", english_substitute: "Coarse Sea Salt", english_amount: "to rim" },
      { name: "冰块", amount: "适量", english_name: "Ice Cubes", english_amount: "to fill" },
    ],
    tools: [
      { name: "玛格丽特杯", alternative: "鸡尾酒杯", english_name: "Margarita Glass", english_alternative: "Cocktail Glass" },
      { name: "雪克杯", alternative: "密封容器", english_name: "Shaker", english_alternative: "Sealed Container" },
      { name: "调酒勺", alternative: "长柄勺", english_name: "Bar Spoon", english_alternative: "Long Spoon" },
    ],
    steps: [
      {
        step_number: 1,
        description: "用青柠片润湿杯口，然后将杯口倒扣在盐盘中，使杯口沾上一圈盐。",
        english_description: "Wet the rim of the glass with a lime wedge, then invert the glass onto a plate of salt to create a salt rim.",
        tips: "只在杯口外侧沾盐，避免盐进入酒中。",
        english_tips: "Only salt the outside of the rim to avoid salt getting into the drink.",
      },
      {
        step_number: 2,
        description: "将龙舌兰酒、君度橙酒、青柠汁和冰块放入雪克杯中。",
        english_description: "Add tequila, Cointreau, lime juice, and ice to the shaker.",
        tips: "使用新鲜青柠汁可以获得最佳风味。",
        english_tips: "Using fresh lime juice provides the best flavor.",
      },
      {
        step_number: 3,
        description: "用力摇晃约15秒，直到雪克杯外壁结霜。",
        english_description: "Shake vigorously for about 15 seconds until the shaker is frosted.",
        tips: "充分摇晃可以确保酒液充分混合和冷却。",
        english_tips: "Thorough shaking ensures proper mixing and cooling of the drink.",
      },
      {
        step_number: 4,
        description: "将调好的酒液过滤倒入已经沾好盐的玛格丽特杯中。",
        english_description: "Strain the mixture into the salt-rimmed margarita glass.",
        tips: "倒酒时动作要轻柔，以免破坏杯口的盐圈。",
        english_tips: "Pour gently to avoid disturbing the salt rim.",
      },
      {
        step_number: 5,
        description: "用青柠片装饰杯口，即可享用。",
        english_description: "Garnish with a lime wedge and serve.",
        tips: "可以根据个人喜好调整酸甜度，增减糖浆或青柠汁。",
        english_tips: "Adjust the sweet and sour balance to taste by adding more or less simple syrup or lime juice.",
      },
    ],
  },
  cosmopolitan: {
    name: "大都会",
    english_name: "Cosmopolitan",
    description:
      "大都会是一款优雅的伏特加鸡尾酒，以其漂亮的粉红色和蔓越莓的甜酸口感而著名。",
    english_description: "An elegant vodka cocktail known for its beautiful pink color and the sweet-tart taste of cranberry.",
    match_reason:
      "这款时尚的鸡尾酒在90年代因《欲望都市》而走红，口感平衡，外观精致。",
    english_match_reason: "This stylish cocktail gained popularity in the 90s through 'Sex and the City', featuring a balanced taste and elegant appearance.",
    base_spirit: "伏特加",
    english_base_spirit: "Vodka",
    alcohol_level: "中",
    english_alcohol_level: "Medium",
    serving_glass: "马天尼杯",
    english_serving_glass: "Martini Glass",
    time_required: "5分钟",
    english_time_required: "5 minutes",
    flavor_profiles: ["甜酸", "果香", "清爽"],
    english_flavor_profiles: ["Sweet & Sour", "Fruity", "Refreshing"],
    ingredients: [
      { name: "柑橘伏特加", amount: "40", unit: "ml", substitute: "普通伏特加", english_name: "Citrus Vodka", english_substitute: "Regular Vodka" },
      { name: "君度橙酒", amount: "20", unit: "ml", english_name: "Cointreau" },
      { name: "蔓越莓汁", amount: "30", unit: "ml", english_name: "Cranberry Juice" },
      { name: "新鲜青柠汁", amount: "15", unit: "ml", english_name: "Fresh Lime Juice" },
      { name: "冰块", amount: "适量", english_name: "Ice Cubes", english_amount: "to fill" },
    ],
    tools: [
      { name: "马天尼杯", alternative: "鸡尾酒杯", english_name: "Martini Glass", english_alternative: "Cocktail Glass" },
      { name: "雪克杯", alternative: "密封容器", english_name: "Shaker", english_alternative: "Sealed Container" },
      { name: "调酒勺", alternative: "长柄勺", english_name: "Bar Spoon", english_alternative: "Long Spoon" },
    ],
    steps: [
      {
        step_number: 1,
        description: "将伏特加、君度橙酒、蔓越莓汁、青柠汁和冰块放入雪克杯中。",
        english_description: "Add vodka, Cointreau, cranberry juice, lime juice, and ice to the shaker.",
        tips: "使用冰冷的杯具可以保持饮品的低温。",
        english_tips: "Using chilled glassware helps maintain the drink's temperature.",
      },
      {
        step_number: 2,
        description: "用力摇晃约15秒，直到雪克杯外壁结霜。",
        english_description: "Shake vigorously for about 15 seconds until the shaker is frosted.",
        tips: "充分摇晃可以使酒液充分混合，并达到理想的稀释度。",
        english_tips: "Thorough shaking ensures proper mixing and achieves the ideal dilution.",
      },
      {
        step_number: 3,
        description: "将调好的酒液过滤倒入预先冰镇的马天尼杯中。",
        english_description: "Strain the mixture into a pre-chilled martini glass.",
        tips: "使用冰镇过的杯子可以保持饮品更长时间的低温。",
        english_tips: "Using a chilled glass helps maintain the drink's temperature longer.",
      },
      {
        step_number: 4,
        description: "用橙皮或柠檬皮装饰，即可享用。",
        english_description: "Garnish with an orange or lemon peel and serve.",
        tips: "轻轻挤压柑橘皮可以释放精油，增添香气。",
        english_tips: "Gently squeeze the citrus peel to release essential oils and add aroma.",
      },
    ],
  },
};

// Get cocktail by ID
export const getCocktailById = async (id: string): Promise<Cocktail | null> => {
  return popularCocktails[id] || null;
};

// Get popular cocktail IDs
export const getPopularCocktailIds = (): string[] => {
  return Object.keys(popularCocktails);
};
