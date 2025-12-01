import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Users, MapPin, Zap, Shield, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FestivalDrive</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Commencer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Gérez vos chauffeurs bénévoles{" "}
            <span className="text-primary">en toute simplicité</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            La plateforme moderne pour coordonner les transports VIP de votre festival.
            Affectation automatique, suivi GPS temps réel, et notifications multi-canal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Démarrer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground text-lg">
            Une solution complète pour automatiser la gestion de vos transports
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Affectation automatique</CardTitle>
              <CardDescription>
                Algorithme intelligent qui assigne les chauffeurs selon disponibilité, équité et proximité
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Suivi GPS temps réel</CardTitle>
              <CardDescription>
                Les VIPs peuvent suivre leur chauffeur en direct sur une carte interactive
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Gestion multi-rôles</CardTitle>
              <CardDescription>
                Coordinateurs, responsables VIP, gestionnaires de chauffeurs : chacun son interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Planning intelligent</CardTitle>
              <CardDescription>
                Tableau interactif type Excel avec détection automatique des conflits horaires
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Notifications multi-canal</CardTitle>
              <CardDescription>
                Email, SMS, Telegram, Discord, Slack : communiquez sur les canaux de votre choix
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Analytics & Rapports</CardTitle>
              <CardDescription>
                Statistiques détaillées et exports pour optimiser vos opérations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-zinc-100 dark:bg-zinc-900 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground text-lg">
              Choisissez le plan adapté à la taille de votre festival
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Gratuit</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">0€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li>✓ Jusqu'à 20 VIPs</li>
                  <li>✓ 5 chauffeurs max</li>
                  <li>✓ 1 festival</li>
                  <li>✓ Affectations manuelles</li>
                  <li>✓ Notifications email</li>
                </ul>
                <Link href="/sign-up" className="block">
                  <Button className="w-full" variant="outline">
                    Commencer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary shadow-lg">
              <CardHeader>
                <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs rounded-full mb-2">
                  POPULAIRE
                </div>
                <CardTitle>Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">29€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li>✓ Jusqu'à 100 VIPs</li>
                  <li>✓ 20 chauffeurs</li>
                  <li>✓ Affectation automatique</li>
                  <li>✓ Suivi GPS temps réel</li>
                  <li>✓ SMS + Telegram + Email</li>
                  <li>✓ Support prioritaire</li>
                </ul>
                <Link href="/sign-up" className="block">
                  <Button className="w-full">Essayer Pro</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">99€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li>✓ VIPs illimités</li>
                  <li>✓ Chauffeurs illimités</li>
                  <li>✓ Festivals illimités</li>
                  <li>✓ Toutes fonctionnalités Pro</li>
                  <li>✓ API & Webhooks</li>
                  <li>✓ Support téléphone</li>
                </ul>
                <Link href="/sign-up" className="block">
                  <Button className="w-full" variant="outline">
                    Contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">
            Prêt à simplifier vos transports ?
          </h2>
          <p className="text-xl text-muted-foreground">
            Rejoignez les festivals qui utilisent FestivalDrive pour coordonner leurs chauffeurs
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Créer mon compte gratuitement <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 FestivalDrive. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
