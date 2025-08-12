import { NextRequest, NextResponse } from 'next/server';

export async function GET(request) {
    const {searchParams} = new URL(request.url);
    const address = searchParams.get('address');
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lon');

    let url = "";
    if (address) {
        url =
        "https://api.openweathermap.org/data/2.5/weather?q=" +
        address +
        "&appid=" +
        "bce003bf5c27f79b0e6cb981b2685bb1";
    } else {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=bce003bf5c27f79b0e6cb981b2685bb1`;
    }
    console.log(url);
    const res = await fetch(url);

    const data = await res.json();
    return NextResponse.json({ data });
}