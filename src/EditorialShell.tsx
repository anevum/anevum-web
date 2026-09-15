import { useEffect, useState, type ReactNode } from "react";
import { CircleUserRound, Menu, Search, X } from "lucide-react";
import { Link, Mark } from "./ui";
import type { SystemSurface } from "./SystemShell";

type PublicSurface = Exclude<SystemSurface, "command">;

const primary = [
  ["STORIES", "/stories"],
  ["UNIVERSE", "/lattice"],
  ["WIKI", "/wiki"],
  ["TRANSMISSIONS", "/transmissions"],
  [