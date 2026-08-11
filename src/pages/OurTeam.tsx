import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone } from "lucide-react";
import teamPam from "@/assets/team-pam.webp";
import teamCollin from "@/assets/team-collin.webp";
import founderElaine from "@/assets/founder-elaine.webp";
import { useSEO } from "@/hooks/useSEO";

export default function OurTeam() {
  const teamMembers = [
    {
      name: "Pam Webber",
      role: "Business Development Manager",
      image: teamPam,
      email: "sales1@maharajaspices.co.za",
      phone: "068 165 1110",
      bio: "Pam brings extensive experience in business development, building strong relationships with clients and partners to grow Maharaja's Spices across South Africa.",
    },
    {
      name: "Collin Pillay",
      role: "Business Development Manager",
      image: teamCollin,
      email: "sales2@maharajaspices.co.za",
      phone: "063 844 3575",
      bio: "Collin specializes in strategic partnerships and market expansion, ensuring Maharaja's Spices reaches customers throughout the region with quality products and service.",
    },
  ];

  useSEO({
    title: "Our Team - Maharaja Spice Emporium",
    description: "Meet the passionate team behind Maharaja Spice Emporium. Dedicated spice experts bringing authentic flavors to South Africa.",
    url: `${window.location.origin}/our-team`,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-primary">
              Meet Our Team
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              The passionate experts bringing authentic spices to your table
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{member.bio}</p>
                  <div className="space-y-2">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      {member.email}
                    </a>
                    <a
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
