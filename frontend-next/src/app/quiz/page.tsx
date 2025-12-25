"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function QuizRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.push("/practice");
    }, [router]);
    return null;
}
