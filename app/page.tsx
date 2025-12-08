import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Calendar, Users, MapPin, Zap, Shield, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-black dark:text-white" />
            <span className="text-xl font-bold tracking-tight">FestivalDrive</span>
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
      <section className="container mx-auto px-4 py-32 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          <h1 className="text-6xl font-bold tracking-tight sm:text-7xl leading-tight">
            Gérez vos chauffeurs bénévoles{" "}
            <span className="relative inline-block">
              <span className="relative z-10">en toute simplicité</span>
              <span className="absolute bottom-2 left-0 w-full h-3 bg-black/10 dark:bg-white/10 -skew-y-1"></span>
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            La plateforme moderne pour coordonner les transports VIP de votre festival.
            Affectation automatique, suivi GPS temps réel, et notifications multi-canal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 px-8 h-12 text-base font-medium">
                Démarrer gratuitement <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base font-medium border-2">
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24 bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 tracking-tight">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Une solution complète pour automatiser la gestion de vos transports
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <Zap className="h-6 w-6 text-white dark:text-black" />
              </div>
              <CardTitle className="text-xl">Affectation automatique</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Algorithme intelligent qui assigne les chauffeurs selon disponibilité, équité et proximité
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white dark:text-black" />
              </div>
              <CardTitle className="text-xl">Suivi GPS temps réel</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Les VIPs peuvent suivre leur chauffeur en direct sur une carte interactive
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <Users className="h-6 w-6 text-white dark:text-black" />
              </div>
              <CardTitle className="text-xl">Gestion multi-rôles</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Coordinateurs, responsables VIP, gestionnaires de chauffeurs : chacun son interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white dark:text-black" />
              </div>
              <CardTitle className="text-xl">Planning intelligent</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Tableau interactif type Excel avec détection automatique des conflits horaires
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <Shield className="h-6 w-6 text-white dark:text-black" />
              </div>
              <CardTitle className="text-xl">Notifications multi-canal</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Email, SMS, Telegram, Discord, Slack : communiquez sur les canaux de votre choix
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20 transition-all">
            <CardHeader className="space-y-4">
              <div className="h-12 w-12 rounded-lg bg-black dark:bg-white flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white dark:text-black" />
              </div>
              <CardTitle className="text-xl">Analytics & Rapports</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Statistiques détaillées et exports pour optimiser vos opérations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white dark:bg-black py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choisissez le plan adapté à la taille de votre festival
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-2 border-black/5 dark:border-white/5">
              <CardHeader className="space-y-4">
                <CardTitle className="text-2xl">Gratuit</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">0€</span>
                  <span className="text-muted-foreground text-lg">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Jusqu'à 20 VIPs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>5 chauffeurs max</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>1 festival</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Affectations manuelles</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Notifications email</span>
                  </li>
                </ul>
                <Link href="/sign-up" className="block">
                  <Button className="w-full h-11 text-base" variant="outline">
                    Commencer
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-4 border-black dark:border-white shadow-2xl scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full tracking-wider">
                  POPULAIRE
                </div>
              </div>
              <CardHeader className="space-y-4 pt-8">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">29€</span>
                  <span className="text-muted-foreground text-lg">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Jusqu'à 100 VIPs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>20 chauffeurs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Affectation automatique</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Suivi GPS temps réel</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>SMS + Telegram + Email</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Support prioritaire</span>
                  </li>
                </ul>
                <Link href="/sign-up" className="block">
                  <Button className="w-full h-11 text-base font-medium">Essayer Pro</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-black/5 dark:border-white/5">
              <CardHeader className="space-y-4">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-5xl font-bold">99€</span>
                  <span className="text-muted-foreground text-lg">/mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-base">
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>VIPs illimités</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Chauffeurs illimités</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Festivals illimités</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Toutes fonctionnalités Pro</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>API & Webhooks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-black dark:text-white mt-1">✓</span>
                    <span>Support téléphone</span>
                  </li>
                </ul>
                <Link href="/sign-up" className="block">
                  <Button className="w-full h-11 text-base" variant="outline">
                    Contacter
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32 text-center bg-neutral-50 dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-5xl font-bold tracking-tight">
            Prêt à simplifier vos transports ?
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Rejoignez les festivals qui utilisent FestivalDrive pour coordonner leurs chauffeurs
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 px-8 h-12 text-base font-medium">
              Créer mon compte gratuitement <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 dark:border-white/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">&copy; 2025 FestivalDrive. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
