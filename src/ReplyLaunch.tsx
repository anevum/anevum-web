import { ArrowDown, ArrowRight, BookOpen, ChevronDown, ExternalLink } from "lucide-react";

type Edition = {
  label: string;
  note: string;
  href?: string;
};

const hardcoverUrl = import.meta.env.VITE_REPLY_HARDCOVER_URL || import.meta.env.VITE_REPLY_BUY_URL || "";
const paperbackUrl = import.meta.env.VITE_REPLY_PAPERBACK_URL || import.meta.env.VITE_REPLY_BUY_URL || "";
const ebookUrl = import.meta.env.VITE_REPLY_EBOOK_URL || import.meta.env.VITE_REPLY_BUY_URL || "";
const sampleUrl