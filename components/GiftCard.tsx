import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Gift, Clock, CheckCircle, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GiftWithStatus, GiftStatus } from '../types/gift';
import { FireworkCelebration } from './FireworkCelebration';

interface GiftCardProps {
  gift: GiftWithStatus;
  isRecipient?: boolean;
  onClaim?: (giftId: string) => Promise<void>;
}

export function GiftCard({ gift, isRecipient, onClaim }: GiftCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilUnlock = (unlockTimestamp: number) => {
    const now = Date.now() / 1000;
    const diff = unlockTimestamp - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: GiftStatus) => {
    switch (status) {
      case GiftStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case GiftStatus.CLAIMABLE:
        return 'bg-green-100 text-green-800 border-green-200';
      case GiftStatus.CLAIMED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: GiftStatus) => {
    switch (status) {
      case GiftStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case GiftStatus.CLAIMABLE:
        return <Gift className="h-4 w-4" />;
      case GiftStatus.CLAIMED:
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const handleClaim = async () => {
    if (!onClaim) return;
    
    setIsClaiming(true);
    try {
      await onClaim(gift.id);
      setJustClaimed(true);
      setShowFireworks(true);
      
      // Hide fireworks after animation completes
      setTimeout(() => {
        setShowFireworks(false);
        setJustClaimed(false);
      }, 4000);
    } catch (error) {
      console.error('Failed to claim gift:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const timeUntilUnlock = getTimeUntilUnlock(gift.unlockTimestamp);

  // Animation variants
  const cardVariants = {
    initial: { scale: 1, rotateY: 0 },
    claiming: {
      scale: 1.02,
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    },
    success: {
      scale: 1.05,
      rotateY: 360,
      transition: {
        duration: 0.8
      }
    },
    idle: { scale: 1, rotateY: 0 }
  };

  const glowVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: [0, 0.6, 0],
      scale: [0.8, 1.2, 1.4],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };

  const confettiVariants = {
    hidden: { opacity: 0, y: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: [0, 1, 0],
      y: [-20, -60, -100],
      x: [0, (i % 2 ? 1 : -1) * (20 + i * 10), (i % 2 ? 1 : -1) * (40 + i * 15)],
      scale: [0, 1, 0.5],
      rotate: [0, 360],
      transition: {
        duration: 2,
        delay: i * 0.1
      }
    })
  };

  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0, rotate: 0 },
    visible: {
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  };

  return (
    <>
      {/* Firework Celebration Overlay */}
      <FireworkCelebration 
        isActive={showFireworks} 
        onComplete={() => setShowFireworks(false)} 
      />
      
      <motion.div
        variants={cardVariants}
        initial="initial"
        animate={
          justClaimed ? "success" : 
          isClaiming ? "claiming" : 
          "idle"
        }
        className="relative"
      >
        {/* Success Glow Effect */}
        <AnimatePresence>
          {justClaimed && (
            <motion.div
              variants={glowVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg blur-xl -z-10"
            />
          )}
        </AnimatePresence>

        {/* Claiming Pulse Effect */}
        <AnimatePresence>
          {isClaiming && (
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: [0, 0.3, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg -z-10"
            />
          )}
        </AnimatePresence>

        {/* Confetti Particles */}
        <AnimatePresence>
          {justClaimed && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={confettiVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={`absolute w-2 h-2 rounded-full ${
                    i % 4 === 0 ? 'bg-yellow-400' :
                    i % 4 === 1 ? 'bg-pink-400' :
                    i % 4 === 2 ? 'bg-blue-400' :
                    'bg-green-400'
                  }`}
                  style={{
                    left: `${20 + (i % 3) * 20}%`,
                    top: `${30 + (i % 2) * 20}%`,
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Sparkle Effects */}
        <AnimatePresence>
          {gift.status === GiftStatus.CLAIMABLE && (
            <>
              <motion.div
                variants={sparkleVariants}
                initial="hidden"
                animate="visible"
                className="absolute top-2 right-2 text-yellow-400"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <motion.div
                variants={sparkleVariants}
                initial="hidden"
                animate="visible"
                className="absolute bottom-4 left-4 text-yellow-400"
                style={{ animationDelay: '0.7s' }}
              >
                <Sparkles className="w-3 h-3" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={isClaiming ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Gift className="h-5 w-5 text-primary" />
                </motion.div>
                <span className="text-sm text-muted-foreground">Gift #{gift.id.slice(0, 8)}</span>
              </div>
              
              <motion.div
                animate={justClaimed ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.6 }}
              >
                <Badge className={`${getStatusColor(gift.status)} flex items-center gap-1`}>
                  {getStatusIcon(gift.status)}
                  {gift.status.charAt(0).toUpperCase() + gift.status.slice(1)}
                </Badge>
              </motion.div>
            </div>

            {/* Amount */}
            <motion.div 
              className="mb-4"
              animate={justClaimed ? { 
                scale: [1, 1.1, 1],
                color: ["#030213", "#10b981", "#030213"]
              } : {}}
              transition={{ duration: 1 }}
            >
              <div className="text-2xl text-primary mb-1">
                {gift.amount} ETH
              </div>
              <div className="text-sm text-muted-foreground">
                ≈ ${(parseFloat(gift.amount) * 2500).toFixed(2)} USD {/* Mock ETH price */}
              </div>
            </motion.div>

            {/* Addresses */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {formatAddress(gift.sender)}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {formatAddress(gift.recipient)}
                </code>
              </div>
            </div>

            {/* Unlock Time */}
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-1">Unlock Date:</div>
              <div className="text-sm">
                {formatDate(gift.unlockTimestamp)}
              </div>
              {timeUntilUnlock && (
                <div className="text-xs text-muted-foreground mt-1">
                  {timeUntilUnlock} remaining
                </div>
              )}
            </div>

            {/* Message */}
            {gift.message && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Message:</div>
                <div className="text-sm italic">{gift.message}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {isRecipient && gift.status === GiftStatus.CLAIMABLE && (
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full relative overflow-hidden"
                  >
                    {isClaiming ? (
                      <>
                        <motion.div
                          animate={{ x: [-100, 400] }}
                          transition={{ 
                            duration: 1.5, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-20"
                        />
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <motion.div
                        className="flex items-center"
                        whileHover={{ x: 2 }}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        Claim Gift
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              )}
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Etherscan
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}