#!/usr/bin/perl
# Met à jour js/actus-insta.js et assets/insta/ à partir du flux Behold relié au compte Instagram du club.
# Meta interdit de lire les pages Instagram par script : ce flux, autorisé par le compte, est la seule source.
#
#   BEHOLD_FLUX=https://feeds.behold.so/xxxx perl scripts/maj-actus.pl
#
# Si le flux est illisible ou vide, rien n'est modifié et le script se termine avec le code 1.
use strict;
use warnings;
use utf8;
use FindBin;
use JSON::PP;

binmode STDOUT, ':encoding(UTF-8)';
binmode STDERR, ':encoding(UTF-8)';

my $RACINE = "$FindBin::Bin/..";
my $SORTIE = "$RACINE/js/actus-insta.js";
my $IMAGES = "$RACINE/assets/insta";
my $NOMBRE = 5;    # deux grandes cards et trois brèves
my $TITRE_MAX = 90;
my $TEXTE_MAX = 220;
my %EXTENSIONS = ('image/webp' => 'webp', 'image/jpeg' => 'jpg', 'image/png' => 'png');

sub echec { my ($msg) = @_; print STDERR "ÉCHEC : $msg\nLes actualités du site n'ont pas été modifiées.\n"; exit 1 }

sub lire_flux {
  my ($url) = @_;
  open my $p, '-|:raw', 'curl', '-sL', '--fail', '-m', '30', $url or return undef;
  my $corps = do { local $/; <$p> };
  close $p or return undef;
  return eval { JSON::PP->new->utf8->decode($corps) };
}

# Le site reste sobre : ni émojis ni adresses web dans les textes repris
sub nettoyer {
  my ($t) = @_;
  $t =~ s{https?://\S+}{}g;
  $t =~ s/[\p{Extended_Pictographic}\x{FE0F}\x{200D}\x{1F1E6}-\x{1F1FF}\x{1F3FB}-\x{1F3FF}]//g;
  return $t;
}

sub couper {
  my ($t, $max) = @_;
  return $t if length($t) <= $max;
  $t = substr($t, 0, $max);
  $t =~ s/\s+\S*$//;
  $t =~ s/[\s,;:.!?-]+$//;
  return "$t…";
}

sub html {
  my ($t) = @_;
  $t =~ s/&/&amp;/g;
  $t =~ s/</&lt;/g;
  $t =~ s/>/&gt;/g;
  $t =~ s/"/&quot;/g;
  return $t;
}

# La première ligne de la légende sert de titre. Trop longue, elle est coupée à sa première phrase, ou à sa première virgule.
sub titre_et_texte {
  my ($legende) = @_;
  my @lignes = grep { /\p{L}|\d/ } map { s/^\s+|\s+$//gr =~ s/\s+/ /gr } split /\n+/, nettoyer($legende // '');
  my $titre = shift(@lignes) // 'Publication Instagram du club';
  if (length($titre) > $TITRE_MAX) {
    my ($debut, $suite) = $titre =~ /^(.{15,$TITRE_MAX}?[.!?])\s+(.+)$/;
    ($debut, $suite) = $titre =~ /^(.{15,$TITRE_MAX}?)[,:;]\s+(.+)$/ unless defined $debut;
    if (defined $debut) {
      $titre = $debut;
      unshift @lignes, ucfirst $suite;
    }
  }
  return (couper($titre, $TITRE_MAX), couper(join(' ', @lignes), $TEXTE_MAX));
}

sub adresse_image {
  my ($post) = @_;
  my $tailles = $post->{sizes} // {};
  for my $nom (qw(medium large small)) {
    my $url = ref $tailles->{$nom} eq 'HASH' ? $tailles->{$nom}{mediaUrl} : undef;
    return $url if $url && $url =~ m{^https://};
  }
  return undef;
}

# Télécharge l'image dans un fichier temporaire et renvoie son extension
sub telecharger {
  my ($url, $temporaire) = @_;
  open my $p, '-|', 'curl', '-sL', '--fail', '-m', '60', '-o', $temporaire, '-w', '%{content_type}', $url or return undef;
  my $type = <$p> // '';
  close $p or return undef;
  return -s $temporaire ? $EXTENSIONS{ lc((split /;/, $type)[0] // '') } : undef;
}

my $url = $ENV{BEHOLD_FLUX} or echec("la variable BEHOLD_FLUX n'est pas définie.");
my $flux = lire_flux($url);
echec('flux illisible.') unless ref $flux eq 'HASH' && ref $flux->{posts} eq 'ARRAY';
mkdir $IMAGES unless -d $IMAGES;

my (@posts, @temporaires, %gardees);
my $annuler = sub { unlink map { $_->[0] } @temporaires; echec($_[0]) };
for my $post (@{ $flux->{posts} }) {
  my $id = $post->{id} // '';
  my $image = adresse_image($post);
  my ($date) = ($post->{timestamp} // '') =~ /^(\d{4}-\d{2}-\d{2})/;
  next unless $id =~ /^[\w-]+$/ && $image && $date && ($post->{permalink} // '') =~ m{^https://www\.instagram\.com/};

  my ($extension) = grep { -e "$IMAGES/$id.$_" } values %EXTENSIONS;
  unless ($extension) {
    my $temporaire = "$IMAGES/$id.tmp";
    $extension = telecharger($image, $temporaire);
    unless ($extension) { unlink $temporaire; $annuler->("image illisible pour la publication $id."); }
    push @temporaires, [$temporaire, "$IMAGES/$id.$extension"];
  }
  $gardees{"$id.$extension"} = 1;

  my ($titre, $texte) = titre_et_texte($post->{prunedCaption} // $post->{caption});
  my $alt = html(nettoyer($post->{altText} // '') || $titre);
  $titre = html($titre) =~ s{\b(\d{1,2} ?- ?\d{1,2})\b}{<mark class="nb">$1</mark>}gr;
  push @posts, { date => $date, tag => 'Instagram', img => "assets/insta/$id.$extension", alt => $alt, titre => $titre, texte => html($texte), lien => $post->{permalink} };
  last if @posts == $NOMBRE;
}
$annuler->('aucune publication exploitable dans le flux.') unless @posts;

my $json = JSON::PP->new->canonical;
my $temporaire = "$SORTIE.tmp";
open my $f, '>:encoding(UTF-8)', $temporaire or $annuler->("écriture impossible : $!");
print $f "/* Fichier généré par scripts/maj-actus.pl : ne pas le modifier à la main. */\nconst POSTS_INSTAGRAM = [\n";
print $f '  ', $json->encode($_), ",\n" for @posts;
print $f "];\n";
close $f or $annuler->("écriture impossible : $!");

rename $_->[0], $_->[1] or $annuler->("écriture impossible : $!") for @temporaires;
rename $temporaire, $SORTIE or echec("écriture impossible : $!");

# Les images qui ne sont plus affichées sont retirées du site
opendir my $d, $IMAGES or echec("dossier d'images illisible : $!");
unlink "$IMAGES/$_" for grep { !/^\./ && !$gardees{$_} } readdir $d;
closedir $d;

print "Actualités à jour : ", scalar(@posts), " publications Instagram.\n";
