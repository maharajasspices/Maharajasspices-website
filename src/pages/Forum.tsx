import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat,
  Flame,
  Utensils,
  Lightbulb,
  MessageCircle,
  Heart,
  ArrowRight,
  Users,
  Sparkles,
} from "lucide-react";

// Recipe images
import beefCurryImg from "@/assets/recipe-beef-curry.webp";
import butterChickenImg from "@/assets/recipe-butter-chicken-new.webp";
import breyaniImg from "@/assets/recipe-breyani.webp";

const Forum = () => {
  const categories = [
    {
      icon: ChefHat,
      title: "Recipe Corner",
      description: "Share recipes, family favourites and dishes you've created.",
    },
    {
      icon: Flame,
      title: "Spice Talk",
      description: "Talk spices, flavours, heat levels and cooking secrets.",
    },
    {
      icon: Utensils,
      title: "South African Food",
      description: "Celebrate the food, traditions and flavours we love.",
    },
    {
      icon: Lightbulb,
      title: "Cooking Tips",
      description: "Share cooking tricks and learn something new.",
    },
  ];

  const discussions = [
    {
      icon: "🌶️",
      title: "What's your secret curry ingredient?",
      replies: 24,
      likes: 42,
      category: "Spice Talk",
    },
    {
      icon: "🍛",
      title: "Potatoes in curry — yes or no?",
      replies: 18,
      likes: 31,
      category: "Recipe Corner",
    },
    {
      icon: "🇿🇦",
      title: "What's your favourite South African comfort food?",
      replies: 12,
      likes: 27,
      category: "South African Food",
    },
    {
      icon: "👩‍🍳",
      title: "What's the one spice you can't cook without?",
      replies: 9,
      likes: 21,
      category: "Cooking Tips",
    },
  ];

  const recipes = [
    {
      title: "Beef Curry",
      image: beefCurryImg,
      description: "Rich, aromatic and packed with flavour.",
    },
    {
      title: "Mother's Hand Butter Chicken",
      image: butterChickenImg,
      description: "Creamy, indulgent and full of flavour.",
    },
    {
      title: "Durban Style Breyani",
      image: breyaniImg,
      description: "A South African favourite made with love.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">

        {/* HERO */}
        <section className="relative min-h-[560px] flex items-center overflow-hidden">
          <img
            src={beefCurryImg}
            alt="Delicious Maharaja's curry"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          <div className="relative container mx-auto px-4 py-24">
            <div className="max-w-2xl text-white">

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">
                  The Maharaja's Community
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold font-playfair leading-tight mb-6">
                Welcome to the
                <span className="block text-primary-foreground">
                  Maharaja's Kitchen
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/85 max-w-xl mb-8 leading-relaxed">
                What's cooking? Share recipes, discover new flavours and
                celebrate the food that brings us together.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  className="font-semibold"
                  onClick={() =>
                    document
                      .getElementById("discussions")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore Discussions
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white text-white bg-white/10 hover:bg-white/20"
                >
                  <Link to="/recipes">Explore Recipes</Link>
                </Button>
              </div>

            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">

            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-primary font-semibold uppercase tracking-widest text-sm">
                What's Cooking?
              </span>

              <h2 className="text-4xl md:text-5xl font-bold font-playfair mt-3 mb-4">
                Find Your Flavour
              </h2>

              <p className="text-muted-foreground text-lg">
                Join conversations about food, spices, recipes and everything
                that makes cooking special.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const Icon = category.icon;

                return (
                  <Card
                    key={category.title}
                    className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                  >
                    <CardContent className="p-7">

                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
                      </div>

                      <h3 className="text-xl font-bold font-playfair mb-3">
                        {category.title}
                      </h3>

                      <p className="text-muted-foreground leading-relaxed">
                        {category.description}
                      </p>

                      <div className="mt-5 flex items-center text-primary text-sm font-medium">
                        Coming soon
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* DISCUSSIONS */}
        <section
          id="discussions"
          className="py-20 bg-muted/30"
        >
          <div className="container mx-auto px-4 max-w-6xl">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-primary font-semibold uppercase tracking-widest text-sm">
                  Join the Conversation
                </span>

                <h2 className="text-4xl font-bold font-playfair mt-2">
                  Trending Discussions
                </h2>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span>Our community is coming soon</span>
              </div>
            </div>

            <div className="space-y-4">
              {discussions.map((discussion) => (
                <Card
                  key={discussion.title}
                  className="group hover:shadow-lg transition-all duration-300"
                >
                  <CardContent className="p-5 md:p-6">

                    <div className="flex items-center gap-4">

                      <div className="hidden sm:flex w-14 h-14 rounded-xl bg-primary/10 items-center justify-center text-2xl flex-shrink-0">
                        {discussion.icon}
                      </div>

                      <div className="flex-1 min-w-0">

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            {discussion.category}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            • Coming soon
                          </span>
                        </div>

                        <h3 className="text-lg md:text-xl font-semibold group-hover:text-primary transition-colors">
                          {discussion.title}
                        </h3>

                        <div className="flex items-center gap-5 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {discussion.replies} replies
                          </span>

                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {discussion.likes}
                          </span>
                        </div>

                      </div>

                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />

                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        </section>

        {/* RECIPES */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-7xl">

            <div className="text-center mb-12">
              <span className="text-primary font-semibold uppercase tracking-widest text-sm">
                From Our Kitchen
              </span>

              <h2 className="text-4xl md:text-5xl font-bold font-playfair mt-3 mb-4">
                Recipes Worth Talking About
              </h2>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover recipes made with the flavours you love.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {recipes.map((recipe) => (
                <Card
                  key={recipe.title}
                  className="overflow-hidden group border-0 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-2xl font-bold font-playfair">
                        {recipe.title}
                      </h3>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <p className="text-muted-foreground mb-5">
                      {recipe.description}
                    </p>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <Link to="/recipes">
                        View Recipe
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}

            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="container mx-auto px-4 max-w-6xl">

            <div className="relative overflow-hidden rounded-3xl bg-primary p-10 md:p-16 text-center text-primary-foreground">

              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10" />
              <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-black/10" />

              <div className="relative max-w-2xl mx-auto">

                <MessageCircle className="w-12 h-12 mx-auto mb-5 opacity-90" />

                <h2 className="text-3xl md:text-5xl font-bold font-playfair mb-5">
                  Something Delicious Is Coming
                </h2>

                <p className="text-lg md:text-xl opacity-90 mb-8">
                  Our community forum is coming soon. Until then, discover
                  delicious recipes and stock up on the Maharaja's spices
                  that bring them to life.
                </p>

                <div className="flex flex-wrap justify-center gap-4">

                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                  >
                    <Link to="/recipes">
                      Explore Recipes
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white/10"
                  >
                    <Link to="/shop">
                      Shop Spices
                    </Link>
                  </Button>

                </div>

              </div>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Forum;