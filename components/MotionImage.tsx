"use client";

import { motion } from "motion/react";
import Image from "next/image";

/**
 * next/image with motion props. The animation runs on the photograph itself:
 * a moving wrapper would be composited on its own, and the white backdrop
 * would cross the mood field as a square instead of multiplying into it.
 */
export const MotionImage = motion.create(Image);
