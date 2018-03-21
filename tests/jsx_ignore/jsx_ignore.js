// this should remain as-is
<div>
  {/* starfire-ignore */}
  <style jsx global>{ComponentStyles}</style>
</div>;

// this should remain as-is
<div>
  {/* starfire-ignore */}
  <span ugly format='' />
</div>;

// this should remain as-is
f(
  <Component>
    {/*starfire-ignore*/}
    <span ugly format='' />
  </Component>
);

// this be formatted
<div>
  {/* starfire-ignore */} foo
  <Bar excessive spaces />
</div>;

// this should remain as-is
<div>
  {
    /* starfire-ignore */
    foo()
  }
</div>;

// this should remain as-is
<div>
  {
    /* starfire-ignore */
    x ? <Y /> : <Z />
  }
</div>;

push(
  // starfire-ignore
  <td> :)
  </td>,
);

function f() {
  return (
    // starfire-ignore
    /* $FlowFixMe(>=0.53.0) */
    <JSX />
  );
}
