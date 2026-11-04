#!/usr/bin/perl
# Met à jour js/resultats.js (scores, calendrier, classements) à partir des pages d'équipes de SportCorico,
# qui reprennent les données de la FFF. Le site de la FFF refuse les lectures automatiques.
#
#   perl scripts/maj-resultats.pl
#
# Si une page est illisible ou incohérente, rien n'est modifié et le script se termine avec le code 1.
use strict;
use warnings;
use utf8;
use FindBin;
use JSON::PP;
use POSIX qw(strftime);

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';

my $RACINE  = "$FindBin::Bin/..";
my $SORTIE  = "$RACINE/js/resultats.js";
my $JOURNAL = "$FindBin::Bin/maj-resultats.log";
my $UA      = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36';

my $CLUB_SLUG = 'as-st-genes-champanelle';
my $CLUB_FFF  = 524952;
my $CLUB_NOM  = 'AS St Genès Champanelle';

my @EQUIPES = (
  { id => 's1', nom => 'Seniors 1', slug => 'st-genes-champ' },
  { id => 's2', nom => 'Seniors 2', slug => 'st-genes-champ-1' },
  { id => 's3', nom => 'Seniors 3', slug => 'st-genes-champ-2' },
);

# Forfaits indiqués par la FFF mais pas par SportCorico : "équipe|date"
my %FORFAITS_FFF = ('s3|2026-10-11' => 1, 's2|2026-11-01' => 1);

my $AVIS_FORFAIT = "Cette équipe est enregistrée en forfait général en championnat par la FFF. Aucun match n'est programmé.";

sub echec { my ($msg) = @_; journal("ÉCHEC : $msg"); print STDERR "ÉCHEC : $msg\nLes résultats du site n'ont pas été modifiés.\n"; exit 1 }

sub journal {
  my ($msg) = @_;
  if (open my $j, '>>:encoding(UTF-8)', $JOURNAL) {
    print $j strftime('%Y-%m-%d %H:%M', localtime), " $msg\n";
    close $j;
  }
}

sub lire_clubs {
  my %clubs;
  open my $f, '<:encoding(UTF-8)', "$FindBin::Bin/clubs.tsv" or echec("clubs.tsv introuvable : $!");
  while (<$f>) {
    next if /^#/ || !/\S/;
    chomp;
    my ($num, $court, $long) = split /\t/;
    $clubs{$num} = { court => $court, long => $long // $court };
  }
  close $f;
  return \%clubs;
}

sub telecharger {
  my ($url) = @_;
  open my $p, '-|:raw', 'curl', '-sL', '--fail', '-m', '30', '-A', $UA, $url or return undef;
  local $/;
  my $contenu = <$p>;
  close $p;
  return $? == 0 ? $contenu : undef;
}

# Les pages embarquent leurs données dans un tableau où chaque valeur renvoie à un indice.
sub lire_donnees {
  my ($html) = @_;
  my ($charge) = $html =~ /<script[^>]*id="__NUXT_DATA__"[^>]*>(.*?)<\/script>/s or return undef;
  my $table = eval { JSON::PP->new->utf8->allow_nonref->decode($charge) } or return undef;
  my $lire;
  $lire = sub {
    my ($i, $profondeur) = @_;
    return undef if !defined $i || $i < 0 || $profondeur > 25;
    my $v = $table->[$i];
    if (ref $v eq 'ARRAY') {
      return $lire->($v->[1], $profondeur + 1) if @$v && defined $v->[0] && $v->[0] =~ /^(?:Shallow)?(?:Reactive|Ref)$/;
      return undef if @$v && defined $v->[0] && $v->[0] !~ /^-?\d+$/;    # types sans intérêt ici (Set, EmptyRef...)
      return [map { $lire->($_, $profondeur + 1) } @$v];
    }
    if (ref $v eq 'HASH') {
      return { map { $_ => $lire->($v->{$_}, $profondeur + 1) } keys %$v };
    }
    return $v;
  };
  return $lire->(0, 0);
}

sub numero_fff { my ($url) = @_; return defined $url && $url =~ /-(\d+)\.\w+$/ ? 0 + $1 : undef }
sub numero_equipe { my ($nom) = @_; return defined $nom && $nom =~ /\s(\d+)$/ ? 0 + $1 : 1 }

sub nom_competition {
  my ($brut) = @_;
  return 'Coupe de France'    if $brut =~ /coupe de france/i;
  return 'Coupe Laura Foot'   if $brut =~ /laura\s*foot/i;
  return 'Coupe Gérard Faure' if $brut =~ /faure/i;
  return 'Coupe Séniquette'   if $brut =~ /s[eé]niquette/i;
  return "Régional $1"        if $brut =~ /r[eé]gional\s*(\d)/i;
  return "Départemental $1"   if $brut =~ /d[eé]partemental\s*(\d)/i;
  return $brut;
}

sub est_coupe { return $_[0] =~ /coupe/i }

sub niveau_equipe {
  my ($equipe) = @_;
  for my $c (@{ $equipe->{competitions} // [] }) {
    my $nom = $c->{fullName} // '';
    next if est_coupe($nom);
    my $comp = nom_competition($nom);
    my ($lettre, $chiffre) = $comp =~ /^(.)\S+ (\d)$/;
    next if !$chiffre;
    my ($poule) = $nom =~ /poule\s+(\S+)/i;
    return ($lettre . $chiffre =~ tr/é/e/r, $comp . ($poule ? " · Poule \U$poule" : ''));
  }
  return (undef, undef);
}

# Récupère un logo manquant : d'abord sur le site de la FFF, sinon celui fourni par SportCorico.
sub logo_disponible {
  my ($num, $url) = @_;
  return undef if !$num;
  my $fichier = "$RACINE/assets/clubs/$num.jpg";
  return $num if -s $fichier;
  my $image = telecharger("https://cdn-transverse.azureedge.net/phlogos/BC$num.jpg") // ($url ? telecharger($url) : undef);
  return undef if !$image;
  open my $f, '>:raw', $fichier or return undef;
  print $f $image;
  close $f;
  journal("Nouveau logo téléchargé : $num");
  return $num;
}

sub lire_match {
  my ($equipe, $g, $clubs) = @_;
  return undef if $g->{exempt};
  my $dom = ($g->{home_club_slug} // '') eq $CLUB_SLUG;
  my $s = $dom ? 'home' : 'outside';
  my $o = $dom ? 'outside' : 'home';
  my ($j, $m, $a) = ($g->{planned_date} // '') =~ m{^(\d\d)/(\d\d)/(\d{4})$} or return undef;
  my $date = "$a-$m-$j";

  my $num  = numero_fff($g->{"${o}_logo"});
  my $base = $num && $clubs->{$num} ? $clubs->{$num}{court} : $g->{"${o}_club_name"};
  my $n    = numero_equipe($g->{"${o}_team_short_name"});
  my %match = (d => $date, c => nom_competition($g->{championship_name} // ''), dom => $dom ? JSON::PP::true : JSON::PP::false,
    adv => $n > 1 ? "$base ($n)" : $base);
  $match{t} = $g->{planned_time} if $g->{planned_time};
  my $logo = logo_disponible($num, $g->{"${o}_logo"});
  $match{logo} = $logo if $logo;

  my $notre_forfait = $g->{"${s}_forfeit"} || $g->{"${s}_forfeit_general"} || $FORFAITS_FFF{"$equipe->{id}|$date"};
  my $forfait_adv   = $g->{"${o}_forfeit"} || $g->{"${o}_forfeit_general"};
  my ($h, $b) = ($g->{home_score}, $g->{outside_score});

  # Un forfait sans score n'a pas de résultat à afficher, sauf s'il est donné gagnant à l'ASSG (3-0 réglementaire)
  if (!defined $h || !defined $b) {
    return undef if $notre_forfait;
    if ($forfait_adv) { ($h, $b) = $dom ? (3, 0) : (0, 3) }
  }
  if (defined $h && defined $b) {
    @match{qw(h a)} = (0 + $h, 0 + $b);
    if ($notre_forfait) { $match{ff} = JSON::PP::true; $match{note} = 'Forfait' }
    elsif ($forfait_adv) { $match{res} = 'V'; $match{note} = 'Forfait adverse' }
    my ($ht, $bt) = ($g->{home_tabs_score}, $g->{outside_tabs_score});
    if (defined $ht && defined $bt) {
      my ($nous, $eux) = $dom ? ($ht, $bt) : ($bt, $ht);
      $match{res}  = $nous > $eux ? 'V' : 'D';
      $match{note} = "$nous-$eux aux tirs au but";
    }
  }
  return \%match;
}

sub lire_classement {
  my ($t, $clubs, $equipe) = @_;
  my @candidats = grep { !est_coupe($_->{championship_name} // '') } @{ $t->{rankings} // [] };
  for my $r (@candidats) {
    my @lignes = sort { ($a->{rank} // 99) <=> ($b->{rank} // 99) } @{ $r->{lines} // [] };
    next if !grep { ($_->{club_slug} // '') eq $CLUB_SLUG } @lignes;
    my $club;
    my @sortie = map {
      my $num = numero_fff($_->{logo});
      my $n   = numero_equipe($_->{team});
      my $est_assg = ($_->{club_slug} // '') eq $CLUB_SLUG;
      my $nom = $est_assg ? "$CLUB_NOM $n" : $num && $clubs->{$num} ? "$clubs->{$num}{long} $n" : $_->{team};
      $club = $nom if $est_assg;
      my $logo = $est_assg ? $CLUB_FFF : logo_disponible($num, $_->{logo});
      [$nom, map({ 0 + ($_ // 0) } @$_{qw(points games_played won nulls lost scored conceded difference)}), $logo // JSON::PP::null]
    } @lignes;
    return (\@sortie, $club);
  }
  return ([], undef);
}

sub lire_equipe {
  my ($equipe, $clubs) = @_;
  my $html = telecharger("https://www.sportcorico.com/clubs/$CLUB_SLUG/$equipe->{slug}") or echec("page $equipe->{nom} injoignable");
  my $racine = lire_donnees($html) or echec("données illisibles pour $equipe->{nom}");
  my ($cle) = grep { /^team-/ } keys %{ $racine->{data} // {} };
  echec("structure inattendue pour $equipe->{nom}") if !$cle;
  my $t = $racine->{data}{$cle};
  echec("aucun match lu pour $equipe->{nom}") if ref $t->{games} ne 'ARRAY' || !@{ $t->{games} };

  my @jeux = sort { ($a->{begin_date_timestamp} // 0) <=> ($b->{begin_date_timestamp} // 0) } @{ $t->{games} };
  my @matchs = grep { defined } map { lire_match($equipe, $_, $clubs) } @jeux;
  my ($classement, $club) = lire_classement($t, $clubs, $equipe);
  echec("classement illisible pour $equipe->{nom}") if @$classement < 4 || !$club;
  my ($court, $niveau) = niveau_equipe($t->{team});
  echec("niveau illisible pour $equipe->{nom}") if !$court;

  my %sortie = (id => $equipe->{id}, nom => $equipe->{nom}, court => $court, niveau => $niveau, club => $club,
    classement => $classement, matchs => \@matchs);
  # Un forfait annoncé sur un match à venir ne peut être qu'un forfait général
  my $general = grep {
    my $s = ($_->{home_club_slug} // '') eq $CLUB_SLUG ? 'home' : 'outside';
    $_->{"${s}_forfeit_general"} || ($_->{"${s}_forfeit"} && !defined $_->{home_score} && ($_->{begin_date_timestamp} // 0) > time);
  } @jeux;
  $sortie{avis} = $AVIS_FORFAIT if $general;
  return \%sortie;
}

sub en_js {
  my ($equipes) = @_;
  my $json = JSON::PP->new->canonical->allow_nonref;
  my @blocs;
  for my $e (@$equipes) {
    my %tete = map { $_ => $e->{$_} } grep { $_ ne 'classement' && $_ ne 'matchs' } keys %$e;
    my $t = $json->encode(\%tete);
    $t =~ s/\}$//;
    push @blocs, "  $t,\n    \"classement\": [\n"
      . join(",\n", map { '      ' . $json->encode($_) } @{ $e->{classement} })
      . "\n    ],\n    \"matchs\": [\n"
      . join(",\n", map { '      ' . $json->encode($_) } @{ $e->{matchs} })
      . "\n    ]\n  }";
  }
  return "[\n" . join(",\n", @blocs) . "\n]";
}

sub anciennes_equipes {
  open my $f, '<:encoding(UTF-8)', $SORTIE or return [];
  local $/;
  my $texte = <$f>;
  close $f;
  my ($bloc) = $texte =~ /const EQUIPES = (\[.*\]);/s or return [];
  return eval { JSON::PP->new->decode($bloc) } // [];
}

sub nouveautes {
  my ($avant, $apres) = @_;
  my %connus;
  for my $e (@$avant) { $connus{"$e->{id}|$_->{d}|$_->{adv}"} = 1 for grep { defined $_->{h} } @{ $e->{matchs} } }
  my @lignes;
  for my $e (@$apres) {
    for my $m (grep { defined $_->{h} } @{ $e->{matchs} }) {
      next if $connus{"$e->{id}|$m->{d}|$m->{adv}"};
      my ($a, $b) = $m->{dom} ? ('ASSG', $m->{adv}) : ($m->{adv}, 'ASSG');
      push @lignes, "$e->{nom} ($m->{d}) : $a $m->{h}-$m->{a} $b";
    }
  }
  return @lignes;
}

my @MOIS = qw(janvier février mars avril mai juin juillet août septembre octobre novembre décembre);
my @jour = localtime;
my $aujourdhui = sprintf('%d %s %d', $jour[3], $MOIS[$jour[4]], $jour[5] + 1900);

my $clubs   = lire_clubs();
my @equipes = map { lire_equipe($_, $clubs) } @EQUIPES;
my $avant   = anciennes_equipes();
my $js      = en_js(\@equipes);
my $change  = en_js($avant) ne $js;
my @nouveaux = @$avant ? nouveautes($avant, \@equipes) : ();

my $contenu = "/* Fichier généré par scripts/maj-resultats.pl : ne pas le modifier à la main. */\n"
  . "const MAJ_RESULTATS = \"$aujourdhui\";\n\nconst EQUIPES = $js;\n";

my $temporaire = "$SORTIE.tmp";
open my $f, '>:encoding(UTF-8)', $temporaire or echec("écriture impossible : $!");
print $f $contenu;
close $f or echec("écriture impossible : $!");
rename $temporaire, $SORTIE or echec("écriture impossible : $!");

my $bilan = $change ? (@nouveaux ? scalar(@nouveaux) . ' nouveau(x) résultat(s)' : 'calendrier ou classement modifié') : 'aucun changement';
journal("OK : $bilan");
print "Résultats à jour le $aujourdhui : $bilan.\n";
print "  $_\n" for @nouveaux;
