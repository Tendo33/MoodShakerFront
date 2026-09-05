import type { StoredCocktailContent } from "@/lib/cocktail-types";
import type {
  AlcoholLevelCode,
  BaseSpirit,
  FlavorProfile,
} from "@/lib/domain/vocabulary";

/**
 * The three classic cocktails used to seed a fresh database.
 *
 * Generated from the migrated rows, so the shape matches what the application
 * writes rather than a hand-maintained parallel copy. These were previously in
 * `lib/cocktail-catalog.ts`, which also served as a silent runtime fallback
 * whenever `DATABASE_URL` looked like a placeholder — that fallback let the
 * project ship with two migrations that had never been applied. This file is
 * seed data only; nothing reads it at runtime.
 */
export interface SeedCocktail {
  slug: string;
  content: StoredCocktailContent;
  baseSpirit: BaseSpirit;
  alcoholLevel: AlcoholLevelCode;
  flavorProfiles: FlavorProfile[];
  imageUrl: string | null;
}

export const seedCocktails: SeedCocktail[] = [
  {
    slug: "mojito",
    baseSpirit: "rum",
    alcoholLevel: "low",
    flavorProfiles: ["refreshing", "sweet", "sour", "herbal"],
    imageUrl: "/vibrant-mojito.png",
    content: {
        "name": {
            "cn": "莫吉托",
            "en": "Mojito"
        },
        "description": {
            "cn": "莫吉托是一款清爽的朗姆酒鸡尾酒，源自古巴，以薄荷、青柠和苏打水的清新口感著称。",
            "en": "A refreshing rum cocktail originating from Cuba, known for its fresh mint, lime, and soda water flavors."
        },
        "matchReason": {
            "cn": "这款低酒精度的清爽鸡尾酒非常受欢迎。莫吉托制作简单，不需要专业工具，且口感清新，带有薄荷和青柠的香气。",
            "en": "This low-alcohol refreshing cocktail is very popular. The Mojito is simple to make, requires no professional tools, and has a fresh taste with mint and lime aromas."
        },
        "servingGlass": {
            "cn": "高球杯",
            "en": "Highball Glass"
        },
        "timeRequired": {
            "cn": "5分钟",
            "en": "5 minutes"
        },
        "ingredients": [
            {
                "name": {
                    "cn": "白朗姆酒",
                    "en": "White Rum"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "60",
                    "en": "60"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "新鲜青柠汁",
                    "en": "Fresh Lime Juice"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "30",
                    "en": "30"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "糖浆",
                    "en": "Simple Syrup"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "15",
                    "en": "15"
                },
                "substitute": {
                    "cn": "白砂糖",
                    "en": "White Sugar"
                }
            },
            {
                "name": {
                    "cn": "薄荷叶",
                    "en": "Mint Leaves"
                },
                "unit": {
                    "cn": "片",
                    "en": "leaves"
                },
                "amount": {
                    "cn": "8-10",
                    "en": "8-10"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "苏打水",
                    "en": "Soda Water"
                },
                "unit": null,
                "amount": {
                    "cn": "适量",
                    "en": "to top"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "冰块",
                    "en": "Ice Cubes"
                },
                "unit": null,
                "amount": {
                    "cn": "适量",
                    "en": "to fill"
                },
                "substitute": null
            }
        ],
        "tools": [
            {
                "name": {
                    "cn": "高球杯",
                    "en": "Highball Glass"
                },
                "alternative": {
                    "cn": "任何玻璃杯",
                    "en": "Any glass"
                }
            },
            {
                "name": {
                    "cn": "调酒勺",
                    "en": "Bar Spoon"
                },
                "alternative": {
                    "cn": "长柄勺",
                    "en": "Long spoon"
                }
            },
            {
                "name": {
                    "cn": "捣棒",
                    "en": "Muddler"
                },
                "alternative": {
                    "cn": "木勺",
                    "en": "Wooden spoon"
                }
            }
        ],
        "steps": [
            {
                "tips": {
                    "cn": "注意不要过度捣碎薄荷叶，以免苦味释放。",
                    "en": "Be careful not to over-muddle the mint leaves to avoid releasing bitterness."
                },
                "stepNumber": 1,
                "description": {
                    "cn": "将薄荷叶和糖浆放入杯中，轻轻捣碎薄荷叶以释放香气。",
                    "en": "Place mint leaves and simple syrup in the glass, gently muddle the mint leaves to release their aroma."
                }
            },
            {
                "tips": {
                    "cn": "先加入青柠汁可以更好地溶解糖分。",
                    "en": "Adding lime juice first helps dissolve the sugar better."
                },
                "stepNumber": 2,
                "description": {
                    "cn": "加入新鲜青柠汁和白朗姆酒。",
                    "en": "Add fresh lime juice and white rum."
                }
            },
            {
                "tips": {
                    "cn": "使用碎冰可以让饮品更快冷却。",
                    "en": "Using crushed ice helps the drink cool down faster."
                },
                "stepNumber": 3,
                "description": {
                    "cn": "加入冰块，用调酒勺轻轻搅拌。",
                    "en": "Add ice cubes and stir gently with a bar spoon."
                }
            },
            {
                "tips": {
                    "cn": "缓慢倒入苏打水以保留气泡。",
                    "en": "Pour the soda water slowly to preserve the bubbles."
                },
                "stepNumber": 4,
                "description": {
                    "cn": "最后加入苏打水至杯口，轻轻搅拌。",
                    "en": "Finally, top with soda water and stir gently."
                }
            },
            {
                "tips": {
                    "cn": "饮用前轻轻搅拌，让风味更均匀。",
                    "en": "Give it a gentle stir before drinking to ensure even flavor distribution."
                },
                "stepNumber": 5,
                "description": {
                    "cn": "用薄荷叶和青柠片装饰，即可享用。",
                    "en": "Garnish with mint leaves and lime slices, then serve."
                }
            }
        ]
    },
  },
  {
    slug: "margarita",
    baseSpirit: "tequila",
    alcoholLevel: "medium",
    flavorProfiles: ["sweet", "sour", "refreshing", "fruity"],
    imageUrl: "/vibrant-margarita.png",
    content: {
        "name": {
            "cn": "玛格丽特",
            "en": "Margarita"
        },
        "description": {
            "cn": "玛格丽特是一款经典的龙舌兰鸡尾酒，以其完美平衡的酸甜口感和盐边杯口而闻名。",
            "en": "A classic tequila cocktail known for its perfectly balanced sweet and sour taste and salted rim."
        },
        "matchReason": {
            "cn": "这款经典鸡尾酒平衡了龙舌兰的烈性与青柠的酸甜，是世界上最受欢迎的鸡尾酒之一。",
            "en": "This classic cocktail balances the strength of tequila with the sweet and sour taste of lime, making it one of the world's most popular cocktails."
        },
        "servingGlass": {
            "cn": "玛格丽特杯",
            "en": "Margarita Glass"
        },
        "timeRequired": {
            "cn": "5分钟",
            "en": "5 minutes"
        },
        "ingredients": [
            {
                "name": {
                    "cn": "龙舌兰酒",
                    "en": "Tequila"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "50",
                    "en": "50"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "君度橙酒",
                    "en": "Cointreau"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "20",
                    "en": "20"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "新鲜青柠汁",
                    "en": "Fresh Lime Juice"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "25",
                    "en": "25"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "细盐",
                    "en": "Fine Salt"
                },
                "unit": null,
                "amount": {
                    "cn": "适量",
                    "en": "to rim"
                },
                "substitute": {
                    "cn": "粗海盐",
                    "en": "Coarse Sea Salt"
                }
            },
            {
                "name": {
                    "cn": "冰块",
                    "en": "Ice Cubes"
                },
                "unit": null,
                "amount": {
                    "cn": "适量",
                    "en": "to fill"
                },
                "substitute": null
            }
        ],
        "tools": [
            {
                "name": {
                    "cn": "玛格丽特杯",
                    "en": "Margarita Glass"
                },
                "alternative": {
                    "cn": "鸡尾酒杯",
                    "en": "Cocktail Glass"
                }
            },
            {
                "name": {
                    "cn": "雪克杯",
                    "en": "Shaker"
                },
                "alternative": {
                    "cn": "密封容器",
                    "en": "Sealed Container"
                }
            },
            {
                "name": {
                    "cn": "调酒勺",
                    "en": "Bar Spoon"
                },
                "alternative": {
                    "cn": "长柄勺",
                    "en": "Long Spoon"
                }
            }
        ],
        "steps": [
            {
                "tips": {
                    "cn": "只在杯口外侧沾盐，避免盐进入酒中。",
                    "en": "Only salt the outside of the rim to avoid salt getting into the drink."
                },
                "stepNumber": 1,
                "description": {
                    "cn": "用青柠片润湿杯口，然后将杯口倒扣在盐盘中，使杯口沾上一圈盐。",
                    "en": "Wet the rim of the glass with a lime wedge, then invert the glass onto a plate of salt to create a salt rim."
                }
            },
            {
                "tips": {
                    "cn": "使用新鲜青柠汁可以获得最佳风味。",
                    "en": "Using fresh lime juice provides the best flavor."
                },
                "stepNumber": 2,
                "description": {
                    "cn": "将龙舌兰酒、君度橙酒、青柠汁和冰块放入雪克杯中。",
                    "en": "Add tequila, Cointreau, lime juice, and ice to the shaker."
                }
            },
            {
                "tips": {
                    "cn": "充分摇晃可以确保酒液充分混合和冷却。",
                    "en": "Thorough shaking ensures proper mixing and cooling of the drink."
                },
                "stepNumber": 3,
                "description": {
                    "cn": "用力摇晃约15秒，直到雪克杯外壁结霜。",
                    "en": "Shake vigorously for about 15 seconds until the shaker is frosted."
                }
            },
            {
                "tips": {
                    "cn": "倒酒时动作要轻柔，以免破坏杯口的盐圈。",
                    "en": "Pour gently to avoid disturbing the salt rim."
                },
                "stepNumber": 4,
                "description": {
                    "cn": "将调好的酒液过滤倒入已经沾好盐的玛格丽特杯中。",
                    "en": "Strain the mixture into the salt-rimmed margarita glass."
                }
            },
            {
                "tips": {
                    "cn": "可以根据个人喜好调整酸甜度，增减糖浆或青柠汁。",
                    "en": "Adjust the sweet and sour balance to taste by adding more or less simple syrup or lime juice."
                },
                "stepNumber": 5,
                "description": {
                    "cn": "用青柠片装饰杯口，即可享用。",
                    "en": "Garnish with a lime wedge and serve."
                }
            }
        ]
    },
  },
  {
    slug: "cosmopolitan",
    baseSpirit: "vodka",
    alcoholLevel: "medium",
    flavorProfiles: ["sweet", "sour", "fruity", "refreshing"],
    imageUrl: "/city-lights-cocktail.png",
    content: {
        "name": {
            "cn": "大都会",
            "en": "Cosmopolitan"
        },
        "description": {
            "cn": "大都会是一款优雅的伏特加鸡尾酒，以其漂亮的粉红色和蔓越莓的甜酸口感而著名。",
            "en": "An elegant vodka cocktail known for its beautiful pink color and the sweet-tart taste of cranberry."
        },
        "matchReason": {
            "cn": "这款时尚的鸡尾酒在90年代因《欲望都市》而走红，口感平衡，外观精致。",
            "en": "This stylish cocktail gained popularity in the 90s through 'Sex and the City', featuring a balanced taste and elegant appearance."
        },
        "servingGlass": {
            "cn": "马天尼杯",
            "en": "Martini Glass"
        },
        "timeRequired": {
            "cn": "5分钟",
            "en": "5 minutes"
        },
        "ingredients": [
            {
                "name": {
                    "cn": "柑橘伏特加",
                    "en": "Citrus Vodka"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "40",
                    "en": "40"
                },
                "substitute": {
                    "cn": "普通伏特加",
                    "en": "Regular Vodka"
                }
            },
            {
                "name": {
                    "cn": "君度橙酒",
                    "en": "Cointreau"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "20",
                    "en": "20"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "蔓越莓汁",
                    "en": "Cranberry Juice"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "30",
                    "en": "30"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "新鲜青柠汁",
                    "en": "Fresh Lime Juice"
                },
                "unit": {
                    "cn": "ml",
                    "en": "ml"
                },
                "amount": {
                    "cn": "15",
                    "en": "15"
                },
                "substitute": null
            },
            {
                "name": {
                    "cn": "冰块",
                    "en": "Ice Cubes"
                },
                "unit": null,
                "amount": {
                    "cn": "适量",
                    "en": "to fill"
                },
                "substitute": null
            }
        ],
        "tools": [
            {
                "name": {
                    "cn": "马天尼杯",
                    "en": "Martini Glass"
                },
                "alternative": {
                    "cn": "鸡尾酒杯",
                    "en": "Cocktail Glass"
                }
            },
            {
                "name": {
                    "cn": "雪克杯",
                    "en": "Shaker"
                },
                "alternative": {
                    "cn": "密封容器",
                    "en": "Sealed Container"
                }
            },
            {
                "name": {
                    "cn": "调酒勺",
                    "en": "Bar Spoon"
                },
                "alternative": {
                    "cn": "长柄勺",
                    "en": "Long Spoon"
                }
            }
        ],
        "steps": [
            {
                "tips": {
                    "cn": "使用冰冷的杯具可以保持饮品的低温。",
                    "en": "Using chilled glassware helps maintain the drink's temperature."
                },
                "stepNumber": 1,
                "description": {
                    "cn": "将伏特加、君度橙酒、蔓越莓汁、青柠汁和冰块放入雪克杯中。",
                    "en": "Add vodka, Cointreau, cranberry juice, lime juice, and ice to the shaker."
                }
            },
            {
                "tips": {
                    "cn": "充分摇晃可以使酒液充分混合，并达到理想的稀释度。",
                    "en": "Thorough shaking ensures proper mixing and achieves the ideal dilution."
                },
                "stepNumber": 2,
                "description": {
                    "cn": "用力摇晃约15秒，直到雪克杯外壁结霜。",
                    "en": "Shake vigorously for about 15 seconds until the shaker is frosted."
                }
            },
            {
                "tips": {
                    "cn": "使用冰镇过的杯子可以保持饮品更长时间的低温。",
                    "en": "Using a chilled glass helps maintain the drink's temperature longer."
                },
                "stepNumber": 3,
                "description": {
                    "cn": "将调好的酒液过滤倒入预先冰镇的马天尼杯中。",
                    "en": "Strain the mixture into a pre-chilled martini glass."
                }
            },
            {
                "tips": {
                    "cn": "轻轻挤压柑橘皮可以释放精油，增添香气。",
                    "en": "Gently squeeze the citrus peel to release essential oils and add aroma."
                },
                "stepNumber": 4,
                "description": {
                    "cn": "用橙皮或柠檬皮装饰，即可享用。",
                    "en": "Garnish with an orange or lemon peel and serve."
                }
            }
        ]
    },
  },
];
